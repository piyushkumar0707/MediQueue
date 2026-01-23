import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const fixQueue = async () => {
  try {
    console.log('🔧 Fixing queue entry...\n');
    
    // Find the doctor
    const doctor = await User.findOne({ email: 'doctor@test.com' });
    if (!doctor) {
      console.error('❌ Doctor not found!');
      process.exit(1);
    }
    console.log('✅ Doctor found:', doctor.personalInfo.firstName, doctor.personalInfo.lastName);
    console.log('   Doctor ID:', doctor._id.toString());

    // Find queue entries with null doctor
    const queues = await Queue.find({ doctor: null });
    console.log(`\n📋 Found ${queues.length} queue entries with null doctor`);

    if (queues.length === 0) {
      console.log('✅ All queue entries have doctors assigned!');
      process.exit(0);
    }

    // Update each queue entry
    for (const queue of queues) {
      console.log(`\n🔧 Updating queue entry ${queue._id}...`);
      queue.doctor = doctor._id;
      await queue.save();
      console.log('✅ Updated successfully!');
    }

    // Verify the fix
    console.log('\n\n✅ Verification:');
    const fixedQueues = await Queue.find({ doctor: doctor._id })
      .populate('patient', 'personalInfo email');
    
    console.log(`   Found ${fixedQueues.length} queue entries for doctor`);
    fixedQueues.forEach((q, idx) => {
      console.log(`\n   Entry ${idx + 1}:`);
      console.log('   Queue Number:', q.queueNumber);
      console.log('   Status:', q.status);
      console.log('   Patient:', q.patient.personalInfo.firstName, q.patient.personalInfo.lastName);
      console.log('   Reason:', q.reasonForVisit);
    });

    console.log('\n✅ Queue fixed successfully!');
    console.log('   Refresh the doctor dashboard to see patients.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixQueue();
