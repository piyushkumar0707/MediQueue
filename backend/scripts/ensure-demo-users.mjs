/**
 * ensure-demo-users.mjs
 * ---------------------
 * Upserts the 3 demo accounts (patient, doctor, admin) into MongoDB.
 * SAFE to run on production — it NEVER wipes data.
 *
 * Usage (local):  node scripts/ensure-demo-users.mjs
 * Usage (Railway shell): node scripts/ensure-demo-users.mjs
 */

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
      allergies: ['Penicillin', 'Dust'],
      chronicConditions: ['Hypertension', 'Mild Asthma'],
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

  console.log('\n==============================================');
  console.log('  MediQueue -- Ensure Demo Users');
  console.log('==============================================\n');

  const hashedPassword = await bcrypt.hash(PASS, 12);
  const collection = mongoose.connection.collection('users');

  let created = 0;
  let updated = 0;

  for (const u of USERS) {
    const existing = await collection.findOne({ email: u.email });

    if (!existing) {
      await collection.insertOne({
        ...u,
        password: hashedPassword,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        mfaEnabled: false,
        loginAttempts: 0,
        lockUntil: null,
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
      console.log('  CREATED  [' + u.role + ']  ' + u.email);
      created++;
    } else {
      await collection.updateOne(
        { email: u.email },
        {
          $set: {
            password: hashedPassword,
            isActive: true,
            loginAttempts: 0,
            lockUntil: null,
            mfaEnabled: false,
            updatedAt: new Date(),
          },
        }
      );
      console.log('  UPDATED  [' + u.role + ']  ' + u.email);
      updated++;
    }
  }

  console.log('\n  Done. Created: ' + created + '  Updated: ' + updated);
  console.log('  Password for all: ' + PASS);
  console.log('==============================================\n');

  await mongoose.connection.close();
};

run().catch(e => {
  console.error('Script failed:', e.message);
  process.exit(1);
});
