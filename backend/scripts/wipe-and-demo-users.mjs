import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../src/config/database.js';

dotenv.config();

const PASS = 'DemoPass@123';

const USERS = [
  {
    email: 'demo.patient@mediqueue.local',
    phoneNumber: '9000001001',
    countryCode: '+91',
    role: 'patient',
    personalInfo: {
      firstName: 'Aarav', lastName: 'Patel',
      dateOfBirth: new Date('1995-04-18'),
      gender: 'male', bloodGroup: 'B+',
      address: { city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
    },
    medicalInfo: {
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension'],
      emergencyContact: { name: 'Riya Patel', relation: 'Spouse', phoneNumber: '9000001009' },
    },
  },
  {
    email: 'demo.doctor@mediqueue.local',
    phoneNumber: '9000002001',
    countryCode: '+91',
    role: 'doctor',
    personalInfo: {
      firstName: 'Meera', lastName: 'Shah',
      dateOfBirth: new Date('1987-09-10'),
      gender: 'female', bloodGroup: 'O+',
      address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    },
    professionalInfo: {
      licenseNumber: 'DEMO-LIC-900001',
      specialty: 'General Medicine',
      qualifications: ['MBBS', 'MD'],
      experience: 12,
      consultationFee: 800,
      availability: [
        { day: 1, startTime: '09:00', endTime: '17:00' },
        { day: 3, startTime: '09:00', endTime: '17:00' },
        { day: 5, startTime: '10:00', endTime: '16:00' },
      ],
      slotDuration: 15,
      maxPatientsPerDay: 30,
      isVerified: true,
      bio: 'General Physician at MediQueue Demo Clinic.',
    },
  },
  {
    email: 'demo.admin@mediqueue.local',
    phoneNumber: '9000003001',
    countryCode: '+91',
    role: 'admin',
    personalInfo: {
      firstName: 'Nikhil', lastName: 'Rao',
      dateOfBirth: new Date('1990-01-22'),
      gender: 'male', bloodGroup: 'A+',
      address: { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    },
  },
];

const run = async () => {
  await connectDB();

  // Wipe everything
  console.log('\nWiping database...');
  const collections = await mongoose.connection.db.collections();
  for (const col of collections) {
    if (col.collectionName.startsWith('system.')) continue;
    const r = await col.deleteMany({});
    console.log(`  Wiped: ${col.collectionName} (${r.deletedCount} docs)`);
  }
  console.log('Wipe complete.\n');

  // Create only demo users
  const hashedPassword = await bcrypt.hash(PASS, 12);
  const User = mongoose.connection.collection('users');

  for (const u of USERS) {
    await User.insertOne({
      ...u,
      password: hashedPassword,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      mfaEnabled: false,
      loginAttempts: 0,
      refreshTokens: [],
      permissions: [],
      notificationPreferences: {
        appointments: { push: true, sms: true, email: true },
        queue: { push: true, sms: true, email: false },
        consent: { push: true, sms: true, email: true },
        emergency: { push: true, sms: true, email: true },
        prescriptions: { push: true, sms: false, email: true },
        quietHours: { enabled: false },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`  ✓ Created: ${u.role.padEnd(7)} → ${u.email}`);
  }

  console.log('\n══════════════════════════════════════');
  console.log('  Done. 3 demo accounts created.');
  console.log('  Password: DemoPass@123 (all accounts)');
  console.log('══════════════════════════════════════\n');

  await mongoose.connection.close();
};

run().catch(e => { console.error(e.message); process.exit(1); });
