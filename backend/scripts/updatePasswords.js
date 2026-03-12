import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/carequeue');

const updatePasswords = async () => {
  try {
    console.log('🔐 Updating passwords to meet security requirements...\n');
    
    const newPassword = 'Test@123'; // Strong password with uppercase, lowercase, number, and special character
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update all test users
    const doctor = await User.findOne({ email: 'doctor@test.com' });
    const patient = await User.findOne({ email: 'patient@test.com' });
    const admin = await User.findOne({ email: 'admin@test.com' });

    if (doctor) {
      doctor.password = hashedPassword;
      await doctor.save();
      console.log('✅ Doctor password updated');
    }

    if (patient) {
      patient.password = hashedPassword;
      await patient.save();
      console.log('✅ Patient password updated');
    }

    if (admin) {
      admin.password = hashedPassword;
      await admin.save();
      console.log('✅ Admin password updated');
    }

    console.log('\n✅ All passwords updated successfully!');
    console.log('\n📝 New login credentials:');
    console.log('   Doctor - Email: doctor@test.com, Password: Test@123');
    console.log('   Patient - Email: patient@test.com, Password: Test@123');
    console.log('   Admin - Email: admin@test.com, Password: Test@123');
    console.log('\n🔒 Password meets requirements:');
    console.log('   ✓ Minimum 8 characters');
    console.log('   ✓ Contains uppercase letter (T)');
    console.log('   ✓ Contains lowercase letters (est)');
    console.log('   ✓ Contains number (123)');
    console.log('   ✓ Contains special character (@)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  }
};

updatePasswords();
