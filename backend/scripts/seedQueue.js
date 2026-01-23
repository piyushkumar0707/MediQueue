import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Queue from '../src/models/Queue.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const seedQueue = async () => {
  try {
    console.log('🔍 Finding users...');
    
    // Find a doctor
    const doctor = await User.findOne({ role: 'doctor' });
    if (!doctor) {
      console.error('❌ No doctor found. Please create a doctor first.');
      process.exit(1);
    }
    console.log('✅ Found doctor:', doctor.personalInfo.firstName, doctor.personalInfo.lastName);

    // Find a patient
    const patient = await User.findOne({ role: 'patient' });
    if (!patient) {
      console.error('❌ No patient found. Please create a patient first.');
      process.exit(1);
    }
    console.log('✅ Found patient:', patient.personalInfo.firstName, patient.personalInfo.lastName);

    // Check if patient already in queue
    const existingQueue = await Queue.findOne({
      patient: patient._id,
      doctor: doctor._id,
      status: { $in: ['waiting', 'in-progress'] }
    });

    if (existingQueue) {
      console.log('⚠️  Patient already in queue. Status:', existingQueue.status);
      console.log('Queue Number:', existingQueue.queueNumber);
      process.exit(0);
    }

    // Get current queue count
    const queueCount = await Queue.countDocuments({
      doctor: doctor._id,
      status: { $in: ['waiting', 'in-progress'] }
    });

    // Create queue entry
    const queueEntry = await Queue.create({
      patient: patient._id,
      doctor: doctor._id,
      queueNumber: queueCount + 1,
      reasonForVisit: 'Test consultation - General checkup',
      priority: 'normal',
      estimatedWaitTime: queueCount * 15,
      status: 'waiting'
    });

    console.log('✅ Queue entry created successfully!');
    console.log('   Queue Number:', queueEntry.queueNumber);
    console.log('   Status:', queueEntry.status);
    console.log('   Patient:', patient.personalInfo.firstName, patient.personalInfo.lastName);
    console.log('   Doctor:', doctor.personalInfo.firstName, doctor.personalInfo.lastName);
    console.log('   Reason:', queueEntry.reasonForVisit);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding queue:', error);
    process.exit(1);
  }
};

seedQueue();
