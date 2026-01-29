import mongoose from 'mongoose';
import User from '../src/models/User.js';

// Connect to MongoDB - USING CORRECT DATABASE NAME
mongoose.connect('mongodb://localhost:27017/carequeue');

const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seed...\n');
    
    // Check if users already exist
    const existingDoctor = await User.findOne({ role: 'doctor' });
    const existingPatient = await User.findOne({ role: 'patient' });
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingDoctor && existingPatient && existingAdmin) {
      console.log('ℹ️  Users already exist:');
      console.log('   Doctor:', existingDoctor.email);
      console.log('   Patient:', existingPatient.email);
      console.log('   Admin:', existingAdmin.email);
      process.exit(0);
    }

    // Use plain password - the User model's pre-save hook will hash it
    const plainPassword = 'Test@123';

    // Create Doctor
    if (!existingDoctor) {
      const doctor = await User.create({
        email: 'doctor@test.com',
        password: plainPassword,
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
      console.log('   Password: Test@123');
      console.log('   Name:', doctor.personalInfo.firstName, doctor.personalInfo.lastName);
    }

    // Create Patient
    if (!existingPatient) {
      const patient = await User.create({
        email: 'patient@test.com',
        password: plainPassword,
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
      console.log('   Password: Test@123');
      console.log('   Name:', patient.personalInfo.firstName, patient.personalInfo.lastName);
    }

    // Create Admin
    if (!existingAdmin) {
      const admin = await User.create({
        email: 'admin@test.com',
        password: plainPassword,
        role: 'admin',
        phoneNumber: '5555555555',
        countryCode: '+1',
        personalInfo: {
          firstName: 'Admin',
          lastName: 'User',
          dateOfBirth: new Date('1985-01-01'),
          gender: 'male',
          address: {
            street: '789 Admin Blvd',
            city: 'Healthcare City',
            state: 'CA',
            pincode: '90212',
            country: 'USA'
          }
        },
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true
      });
      console.log('\n✅ Admin created:');
      console.log('   Email:', admin.email);
      console.log('   Password: Test@123');
      console.log('   Name:', admin.personalInfo.firstName, admin.personalInfo.lastName);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Doctor - Email: doctor@test.com, Password: Test@123');
    console.log('   Patient - Email: patient@test.com, Password: Test@123');
    console.log('   Admin - Email: admin@test.com, Password: Test@123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
