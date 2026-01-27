import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

dotenv.config();

const debugQueue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get all doctors
    const doctors = await User.find({ role: 'doctor' })
      .select('_id email personalInfo.firstName personalInfo.lastName');
    
    console.log('=== DOCTORS IN DATABASE ===');
    doctors.forEach(d => {
      console.log(`ID: ${d._id.toString()}`);
      console.log(`Name: ${d.personalInfo?.firstName} ${d.personalInfo?.lastName}`);
      console.log(`Email: ${d.email}\n`);
    });

    // Get active queue entries
    const queue = await Queue.find({ 
      status: { $in: ['waiting', 'in-progress'] } 
    })
    .populate('patient', 'personalInfo email')
    .populate('doctor', 'personalInfo email');
    
    console.log('\n=== ACTIVE QUEUE ENTRIES ===');
    if (queue.length === 0) {
      console.log('No active queue entries found');
    } else {
      queue.forEach(q => {
        console.log(`\nQueue ID: ${q._id}`);
        console.log(`Queue Number: ${q.queueNumber}`);
        console.log(`Patient: ${q.patient?.personalInfo?.firstName} ${q.patient?.personalInfo?.lastName}`);
        console.log(`Patient ID: ${q.patient?._id}`);
        console.log(`Doctor: ${q.doctor?.personalInfo?.firstName} ${q.doctor?.personalInfo?.lastName}`);
        console.log(`Doctor ID: ${q.doctor?._id}`);
        console.log(`Status: ${q.status}`);
        console.log(`Priority: ${q.priority}`);
        console.log(`Check-in: ${q.checkInTime}`);
        console.log(`Reason: ${q.reasonForVisit}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugQueue();
