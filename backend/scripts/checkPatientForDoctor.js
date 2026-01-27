import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

dotenv.config();

const checkPatientQueue = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get the patient who was trying to join
    const patient = await User.findOne({ 
      'personalInfo.firstName': 'PIyush' 
    });
    
    if (!patient) {
      console.log('Patient not found');
      process.exit(0);
    }

    console.log('=== PATIENT INFO ===');
    console.log(`ID: ${patient._id}`);
    console.log(`Name: ${patient.personalInfo?.firstName} ${patient.personalInfo?.lastName}`);
    console.log(`Email: ${patient.email}\n`);

    // Get Doctor 1
    const doctor = await User.findOne({ email: 'doctor1@gmail.com' });
    
    if (!doctor) {
      console.log('Doctor not found');
      process.exit(0);
    }

    console.log('=== DOCTOR INFO ===');
    console.log(`ID: ${doctor._id}`);
    console.log(`Name: ${doctor.personalInfo?.firstName} ${doctor.personalInfo?.lastName}`);
    console.log(`Email: ${doctor.email}\n`);

    // Check if patient has an active queue entry for this doctor
    const existingQueue = await Queue.findOne({
      patient: patient._id,
      doctor: doctor._id,
      status: { $in: ['waiting', 'in-progress'] }
    });

    if (existingQueue) {
      console.log('=== EXISTING QUEUE ENTRY FOUND ===');
      console.log(`Queue ID: ${existingQueue._id}`);
      console.log(`Status: ${existingQueue.status}`);
      console.log(`Queue Number: ${existingQueue.queueNumber}`);
      console.log(`Priority: ${existingQueue.priority}`);
      console.log(`Check-in: ${existingQueue.checkInTime}`);
      console.log(`Called Time: ${existingQueue.calledTime || 'NOT SET'}`);
      console.log(`Reason: ${existingQueue.reasonForVisit}\n`);
      console.log('⚠️  This is why the patient cannot join the queue again!');
      console.log('   The patient already has an active queue entry for this doctor.');
    } else {
      console.log('✅ No active queue entry found - patient can join!');
    }

    // Show all queue entries for this patient
    const allQueues = await Queue.find({
      patient: patient._id
    }).populate('doctor', 'personalInfo email');

    console.log(`\n=== ALL QUEUE ENTRIES FOR PATIENT (${allQueues.length}) ===`);
    allQueues.forEach(q => {
      console.log(`\nDoctor: ${q.doctor?.personalInfo?.firstName} ${q.doctor?.personalInfo?.lastName}`);
      console.log(`Status: ${q.status}`);
      console.log(`Check-in: ${q.checkInTime}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkPatientQueue();
