import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

dotenv.config();

const testDoctorQueue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get Doctor 1
    const doctor = await User.findOne({ email: 'doctor1@gmail.com' });
    
    if (!doctor) {
      console.log('Doctor not found!');
      process.exit(1);
    }

    console.log('=== DOCTOR INFO ===');
    console.log(`ID: ${doctor._id}`);
    console.log(`Name: ${doctor.personalInfo?.firstName} ${doctor.personalInfo?.lastName}`);
    console.log(`Email: ${doctor.email}\n`);

    // Simulate the API call - get doctor's queue with different status filters
    console.log('=== TESTING QUEUE QUERIES ===\n');

    // 1. Only waiting
    const waitingQueue = await Queue.find({
      doctor: doctor._id,
      status: 'waiting'
    })
    .populate('patient', 'personalInfo phoneNumber email')
    .sort({ priority: -1, checkInTime: 1 });
    
    console.log(`Waiting queue (${waitingQueue.length}):`);
    waitingQueue.forEach(q => console.log(`  - ${q.patient?.personalInfo?.firstName} (${q.status})`));

    // 2. Only in-progress
    const inProgressQueue = await Queue.find({
      doctor: doctor._id,
      status: 'in-progress'
    })
    .populate('patient', 'personalInfo phoneNumber email')
    .sort({ priority: -1, checkInTime: 1 });
    
    console.log(`\nIn-Progress queue (${inProgressQueue.length}):`);
    inProgressQueue.forEach(q => console.log(`  - ${q.patient?.personalInfo?.firstName} (${q.status})`));

    // 3. All active (waiting + in-progress)
    const allActiveQueue = await Queue.find({
      doctor: doctor._id,
      status: { $in: ['waiting', 'in-progress'] }
    })
    .populate('patient', 'personalInfo phoneNumber email')
    .sort({ priority: -1, checkInTime: 1 });
    
    console.log(`\nAll Active queue (${allActiveQueue.length}):`);
    allActiveQueue.forEach(q => console.log(`  - ${q.patient?.personalInfo?.firstName} (${q.status})`));

    // 4. Default query from controller (status = 'waiting' by default)
    const defaultQuery = await Queue.find({
      doctor: doctor._id,
      status: 'waiting' // This is what the API uses by default!
    })
    .populate('patient', 'personalInfo phoneNumber email')
    .sort({ priority: -1, checkInTime: 1 });
    
    console.log(`\nDefault API query (status='waiting') (${defaultQuery.length}):`);
    defaultQuery.forEach(q => console.log(`  - ${q.patient?.personalInfo?.firstName} (${q.status})`));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testDoctorQueue();
