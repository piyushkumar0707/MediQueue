import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

dotenv.config();

const checkQueue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const queue = await Queue.find({ 
      status: { $in: ['waiting', 'in-progress'] } 
    })
    .populate('patient', 'personalInfo email')
    .populate('doctor', 'personalInfo email');
    
    console.log(`Found ${queue.length} active queue entries\n`);
    
    queue.forEach(q => {
      console.log(`\nQueue ID: ${q._id}`);
      console.log(`Patient: ${q.patient?.personalInfo?.firstName} ${q.patient?.personalInfo?.lastName}`);
      console.log(`Doctor: ${q.doctor?.personalInfo?.firstName} ${q.doctor?.personalInfo?.lastName}`);
      console.log(`Status: ${q.status}`);
      console.log(`Check-in: ${q.checkInTime}`);
      console.log(`Called Time: ${q.calledTime || 'NOT SET'}`);
      console.log(`Completed Time: ${q.completedTime || 'NOT SET'}`);
      
      if (q.status === 'in-progress' && !q.calledTime) {
        console.log(`⚠️  WARNING: This entry is in-progress but was never called!`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkQueue();
