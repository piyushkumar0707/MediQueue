import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

mongoose.connect('mongodb://localhost:27017/mediqueue');

const fixDoctorPassword = async () => {
  try {
    console.log('Fixing doctor password...\n');
    
    // Delete existing doctor and create new one
    await User.deleteOne({ email: 'doctor@test.com' });
    console.log('✅ Deleted old doctor user\n');
    
    // Create new doctor - pass plain password, pre-save hook will hash it
    const doctor = await User.create({
      email: 'doctor@test.com',
      password: 'password123', // Plain text - will be hashed by pre-save hook
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
          { day: 1, startTime: '09:00', endTime: '17:00' },
          { day: 2, startTime: '09:00', endTime: '17:00' },
          { day: 3, startTime: '09:00', endTime: '17:00' },
          { day: 4, startTime: '09:00', endTime: '17:00' },
          { day: 5, startTime: '09:00', endTime: '17:00' }
        ]
      },
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true
    });
    
    console.log('✅ Created new doctor user');
    console.log('   Email:', doctor.email);
    console.log('   Password: password123\n');
    
    // Verify it immediately
    const testUser = await User.findByPhoneOrEmail('doctor@test.com');
    console.log('Verifying password...');
    console.log('   Has password field:', !!testUser.password);
    console.log('   Password length:', testUser.password?.length);
    
    const isMatch = await bcrypt.compare('password123', testUser.password);
    console.log('   Password match:', isMatch);
    
    if (isMatch) {
      console.log('\n✅ SUCCESS! You can now login with:');
      console.log('   Email: doctor@test.com');
      console.log('   Password: password123');
    } else {
      console.log('\n❌ Password verification failed!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixDoctorPassword();
