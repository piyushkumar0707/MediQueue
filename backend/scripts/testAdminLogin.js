import mongoose from 'mongoose';
import User from '../src/models/User.js';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue');

const testLogin = async () => {
  try {
    console.log('🔍 Testing admin login...\n');
    
    // Find admin user
    const admin = await User.findOne({ email: 'admin@test.com' }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      process.exit(1);
    }
    
    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Active:', admin.isActive);
    console.log('   Password hash exists:', !!admin.password);
    console.log('   Password hash length:', admin.password ? admin.password.length : 0);
    console.log('\n🔐 Testing password: Test@123');
    
    // Test password
    const testPassword = 'Test@123';
    const isMatch = await bcrypt.compare(testPassword, admin.password);
    
    console.log('   Password match:', isMatch);
    
    if (!isMatch) {
      console.log('\n❌ Password does not match!');
      console.log('   This means the password was not hashed correctly during seeding.');
    } else {
      console.log('\n✅ Password matches! Login should work.');
    }
    
    // Also test with comparePassword method
    console.log('\n🔍 Testing with User.comparePassword method...');
    const isMatchMethod = await admin.comparePassword(testPassword);
    console.log('   Password match (method):', isMatchMethod);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testLogin();
