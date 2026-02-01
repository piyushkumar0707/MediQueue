import mongoose from 'mongoose';
import User from '../src/models/User.js';

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/carequeue';

async function getPatientId() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a patient
    const patient = await User.findOne({ role: 'patient' });
    
    if (patient) {
      console.log('📋 Patient Found:');
      console.log('─────────────────────────────────');
      console.log(`Name: ${patient.personalInfo?.firstName} ${patient.personalInfo?.lastName}`);
      console.log(`Email: ${patient.email}`);
      console.log(`ID: ${patient._id}`);
      console.log('─────────────────────────────────\n');
      console.log('🎯 Copy this ID for emergency access request:');
      console.log(patient._id.toString());
    } else {
      console.log('❌ No patients found in database');
      console.log('💡 Run: npm run seed:users to create test users');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getPatientId();
