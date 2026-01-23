import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

mongoose.connect('mongodb://localhost:27017/mediqueue');

const testLogin = async () => {
  try {
    console.log('Testing doctor@test.com login...\n');
    
    // Find user
    const user = await User.findByPhoneOrEmail('doctor@test.com');
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }
    
    console.log('✅ User found');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Has password:', !!user.password);
    console.log('   Password length:', user.password?.length);
    console.log('   Password starts with $2:', user.password?.startsWith('$2'));
    
    // Test password comparison
    const testPassword = 'password123';
    console.log('\nTesting password:', testPassword);
    
    try {
      const isMatch = await user.comparePassword(testPassword);
      console.log('✅ Password comparison result:', isMatch);
      
      if (isMatch) {
        console.log('\n✅ LOGIN SUCCESSFUL!');
      } else {
        console.log('\n❌ PASSWORD DOES NOT MATCH!');
        
        // Try direct bcrypt compare
        console.log('\nTrying direct bcrypt.compare...');
        const directMatch = await bcrypt.compare(testPassword, user.password);
        console.log('Direct bcrypt result:', directMatch);
      }
    } catch (error) {
      console.log('❌ comparePassword error:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
};

testLogin();
