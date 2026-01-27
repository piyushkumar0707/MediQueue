import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Queue from '../src/models/Queue.js';

dotenv.config();

const fixQueueStatus = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find queue entries that are "in-progress" but have no calledTime
    // These should be "waiting" instead
    const incorrectEntries = await Queue.find({
      status: 'in-progress',
      calledTime: null
    }).populate('patient', 'personalInfo email')
      .populate('doctor', 'personalInfo email');

    console.log(`Found ${incorrectEntries.length} queue entries with incorrect status\n`);

    if (incorrectEntries.length === 0) {
      console.log('✅ All queue entries have correct status!');
      process.exit(0);
    }

    console.log('=== FIXING QUEUE ENTRIES ===\n');
    
    let fixed = 0;
    let deleted = 0;
    
    for (const entry of incorrectEntries) {
      console.log(`Checking entry ID: ${entry._id}`);
      
      // Check if entry is corrupted (missing required fields)
      if (!entry.patient || !entry.doctor || !entry.reasonForVisit || !entry.queueNumber) {
        console.log(`  ⚠️  Corrupted entry detected - deleting...`);
        await Queue.deleteOne({ _id: entry._id });
        deleted++;
        console.log(`  ✅ Deleted corrupted entry\n`);
        continue;
      }
      
      console.log(`  Patient: ${entry.patient?.personalInfo?.firstName} ${entry.patient?.personalInfo?.lastName}`);
      console.log(`  Doctor: ${entry.doctor?.personalInfo?.firstName} ${entry.doctor?.personalInfo?.lastName}`);
      console.log(`  Current Status: ${entry.status}`);
      console.log(`  Called Time: ${entry.calledTime}`);
      
      // Update status to waiting using updateOne to avoid validation issues
      await Queue.updateOne(
        { _id: entry._id },
        { $set: { status: 'waiting' } }
      );
      
      fixed++;
      console.log(`  ✅ Updated status to: waiting\n`);
    }

    console.log(`\n✅ Fixed ${fixed} queue entries!`);
    console.log(`🗑️  Deleted ${deleted} corrupted entries!`);
    
    // Verify the fix
    const remaining = await Queue.countDocuments({
      status: 'in-progress',
      calledTime: null
    });
    
    console.log(`Remaining incorrect entries: ${remaining}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixQueueStatus();
