/**
 * Demo Seed Script
 * Drops the carequeue database and populates fresh demo data.
 *
 * Credentials after running:
 *   Patient  → demo.patient@carequeue.com  / Demo@1234
 *   Doctor   → demo.doctor@carequeue.com   / Demo@1234
 *   Doctor 2 → demo.doctor2@carequeue.com  / Demo@1234
 *   Admin    → demo.admin@carequeue.com    / Demo@1234
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carequeue';

// ─── Minimal inline schema (avoids Mongoose middleware double-hash issues) ───
import User from '../src/models/User.js';

const run = async () => {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // ── Drop entire database ──────────────────────────────────────────────────
  console.log('🗑️  Dropping existing database...');
  await mongoose.connection.dropDatabase();
  console.log('✅ Database dropped.\n');

  // ── Hash password (bypass pre-save hook via raw collection later) ─────────
  const hash = await bcrypt.hash('Demo@1234', 12);

  // ── Create Patients ───────────────────────────────────────────────────────
  const patientData = {
    email: 'demo.patient@carequeue.com',
    password: hash,
    role: 'patient',
    phoneNumber: '9000000001',
    countryCode: '+91',
    personalInfo: {
      firstName: 'Priya',
      lastName: 'Sharma',
      dateOfBirth: new Date('1995-04-12'),
      gender: 'female',
      bloodGroup: 'B+',
      address: {
        street: '12 MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        country: 'India',
      },
    },
    medicalInfo: {
      allergies: ['Penicillin'],
      chronicConditions: ['Mild Hypertension'],
      emergencyContact: {
        name: 'Rahul Sharma',
        relation: 'Brother',
        phoneNumber: '9000000099',
      },
    },
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  const patient2Data = {
    email: 'demo.patient2@carequeue.com',
    password: hash,
    role: 'patient',
    phoneNumber: '9000000002',
    countryCode: '+91',
    personalInfo: {
      firstName: 'Arjun',
      lastName: 'Mehta',
      dateOfBirth: new Date('1988-11-23'),
      gender: 'male',
      bloodGroup: 'O+',
      address: {
        street: '45 Park Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
      },
    },
    medicalInfo: {
      allergies: [],
      chronicConditions: ['Type 2 Diabetes'],
      emergencyContact: {
        name: 'Sunita Mehta',
        relation: 'Wife',
        phoneNumber: '9000000098',
      },
    },
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  // ── Create Doctors ────────────────────────────────────────────────────────
  const doctorData = {
    email: 'demo.doctor@carequeue.com',
    password: hash,
    role: 'doctor',
    phoneNumber: '9000000003',
    countryCode: '+91',
    personalInfo: {
      firstName: 'Anil',
      lastName: 'Verma',
      dateOfBirth: new Date('1978-07-05'),
      gender: 'male',
      address: {
        street: '10 Hospital Lane',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India',
      },
    },
    professionalInfo: {
      licenseNumber: 'MCI-DL-00123',
      specialty: 'General Physician',
      qualifications: ['MBBS', 'MD – General Medicine'],
      experience: 14,
      consultationFee: 500,
      bio: 'Experienced general physician with 14 years of clinical practice.',
      isVerified: true,
      availability: [
        { day: 1, startTime: '09:00', endTime: '17:00' },
        { day: 2, startTime: '09:00', endTime: '17:00' },
        { day: 3, startTime: '09:00', endTime: '17:00' },
        { day: 4, startTime: '09:00', endTime: '17:00' },
        { day: 5, startTime: '09:00', endTime: '17:00' },
      ],
      slotDuration: 15,
      maxPatientsPerDay: 30,
      rating: 4.7,
      reviewCount: 128,
    },
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  const doctor2Data = {
    email: 'demo.doctor2@carequeue.com',
    password: hash,
    role: 'doctor',
    phoneNumber: '9000000004',
    countryCode: '+91',
    personalInfo: {
      firstName: 'Kavita',
      lastName: 'Nair',
      dateOfBirth: new Date('1982-03-18'),
      gender: 'female',
      address: {
        street: '22 Wellness Ave',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600001',
        country: 'India',
      },
    },
    professionalInfo: {
      licenseNumber: 'MCI-TN-00456',
      specialty: 'Cardiologist',
      qualifications: ['MBBS', 'MD – Cardiology', 'DM'],
      experience: 10,
      consultationFee: 800,
      bio: 'Specialist cardiologist focused on preventive cardiac care.',
      isVerified: true,
      availability: [
        { day: 1, startTime: '10:00', endTime: '16:00' },
        { day: 3, startTime: '10:00', endTime: '16:00' },
        { day: 5, startTime: '10:00', endTime: '16:00' },
      ],
      slotDuration: 20,
      maxPatientsPerDay: 20,
      rating: 4.9,
      reviewCount: 95,
    },
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  // ── Create Admin ──────────────────────────────────────────────────────────
  const adminData = {
    email: 'demo.admin@carequeue.com',
    password: hash,
    role: 'admin',
    phoneNumber: '9000000005',
    countryCode: '+91',
    personalInfo: {
      firstName: 'Ravi',
      lastName: 'Kumar',
      dateOfBirth: new Date('1980-06-15'),
      gender: 'male',
      address: {
        street: '1 Admin HQ',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500001',
        country: 'India',
      },
    },
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true,
  };

  // ── Insert all users (raw collection insert — bypasses pre-save hook so
  //    the already-bcrypt-hashed password isn't double-hashed) ───────────────
  const allUsers = [patientData, patient2Data, doctorData, doctor2Data, adminData];

  // Add Mongoose fields manually
  const now = new Date();
  const docs = allUsers.map(u => ({
    ...u,
    loginAttempts: 0,
    refreshTokens: [],
    mfaEnabled: false,
    permissions: [],
    createdAt: now,
    updatedAt: now,
  }));

  const inserted = await User.collection.insertMany(docs);
  console.log(`✅ Inserted ${inserted.insertedCount} users.\n`);

  // ── Print credentials ─────────────────────────────────────────────────────
  console.log('═'.repeat(55));
  console.log('  DEMO CREDENTIALS (password for all: Demo@1234)');
  console.log('═'.repeat(55));
  console.log('  PATIENT  → demo.patient@carequeue.com');
  console.log('  PATIENT2 → demo.patient2@carequeue.com');
  console.log('  DOCTOR   → demo.doctor@carequeue.com');
  console.log('  DOCTOR2  → demo.doctor2@carequeue.com');
  console.log('  ADMIN    → demo.admin@carequeue.com');
  console.log('═'.repeat(55));

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
