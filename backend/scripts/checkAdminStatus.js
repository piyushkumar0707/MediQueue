import mongoose from 'mongoose';
import User from '../src/models/User.js';

mongoose.connect('mongodb://localhost:27017/mediqueue');

const checkAdminStatus = async () => {
  try {
    console.log('🔍 Checking admin user status...\n');
    
    const admin = await User.findOne({ email: 'admin@test.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }
    
    console.log('Admin User Details:');
    console.log('  Email:', admin.email);
    console.log('  Role:', admin.role);
    console.log('  Active:', admin.isActive);
    console.log('  Email Verified:', admin.isEmailVerified);
    console.log('  Phone Verified:', admin.isPhoneVerified);
    console.log('  Login Attempts:', admin.loginAttempts);
    console.log('  Lock Until:', admin.lockUntil);
    console.log('  Is Locked:', admin.isLocked);
    
    if (admin.loginAttempts > 0 || admin.lockUntil) {
      console.log('\n⚠️  Resetting login attempts and unlocking account...');
      admin.loginAttempts = 0;
      admin.lockUntil = undefined;
      await admin.save();
      console.log('✅ Admin account unlocked and reset!');
    } else {
      console.log('\n✅ Admin account is in good standing');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkAdminStatus();
