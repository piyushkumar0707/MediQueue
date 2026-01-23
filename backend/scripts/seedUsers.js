import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue');

const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seed...\n');
    
    // Check if users already exist
    const existingDoctor = await User.findOne({ role: 'doctor' });
    const existingPatient = await User.findOne({ role: 'patient' });

    if (existingDoctor && existingPatient) {
      console.log('ℹ️  Users already exist:');
      console.log('   Doctor:', existingDoctor.email);
      console.log('   Patient:', existingPatient.email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create Doctor
    if (!existingDoctor) {
      const doctor = await User.create({
        email: 'doctor@test.com',
        password: hashedPassword,
        role: 'doctor',
        phoneNumber: '1234567890',
        countryCode: '+1',
        personalInfo: {
          firstName: 'John',
          lastName: 'Smith',
          dateOfBirth: new Date('1980-05-15'),
          gender: 'male',
          address: {
            street: '123 Medical Center Dr',
            city: 'Healthcare City',
            state: 'CA',
            pincode: '90210',
            country: 'USA'
          }
        },
        professionalInfo: {
          licenseNumber: 'MD-123456',
          specialty: 'General Physician',
          experience: 15,
          consultationFee: 100,
          qualifications: ['MBBS', 'MD'],
          availability: [
            { day: 1, startTime: '09:00', endTime: '17:00' }, // Monday
            { day: 2, startTime: '09:00', endTime: '17:00' }, // Tuesday
            { day: 3, startTime: '09:00', endTime: '17:00' }, // Wednesday
            { day: 4, startTime: '09:00', endTime: '17:00' }, // Thursday
            { day: 5, startTime: '09:00', endTime: '17:00' }  // Friday
          ]
        },
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      console.log('✅ Doctor created:');
      console.log('   Email:', doctor.email);
      console.log('   Password: password123');
      console.log('   Name:', doctor.personalInfo.firstName, doctor.personalInfo.lastName);
    }

    // Create Patient
    if (!existingPatient) {
      const patient = await User.create({
        email: 'patient@test.com',
        password: hashedPassword,
        role: 'patient',
        phoneNumber: '9876543210',
        countryCode: '+1',
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: new Date('1995-08-20'),
          gender: 'female',
          bloodGroup: 'O+',
          address: {
            street: '456 Patient St',
            city: 'Healthcare City',
            state: 'CA',
            pincode: '90211',
            country: 'USA'
          }
        },
        medicalInfo: {
          allergies: [],
          chronicConditions: [],
          emergencyContact: {
            name: 'John Doe',
            relation: 'Spouse',
            phoneNumber: '9876543211'
          }
        },
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      console.log('\n✅ Patient created:');
      console.log('   Email:', patient.email);
      console.log('   Password: password123');
      console.log('   Name:', patient.personalInfo.firstName, patient.personalInfo.lastName);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Doctor - Email: doctor@test.com, Password: password123');
    console.log('   Patient - Email: patient@test.com, Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
