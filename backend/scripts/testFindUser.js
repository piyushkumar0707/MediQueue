import mongoose from 'mongoose';
import User from '../src/models/User.js';

mongoose.connect('mongodb://localhost:27017/mediqueue');

const testFindByPhoneOrEmail = async () => {
  try {
    console.log('🔍 Testing findByPhoneOrEmail function...\n');
    
    const testEmail = 'admin@test.com';
    console.log('Searching for:', testEmail);
    console.log('Lowercase:', testEmail.toLowerCase());
    
    // Test the static method
    const user1 = await User.findByPhoneOrEmail(testEmail);
    console.log('\nUsing findByPhoneOrEmail:', !!user1);
    if (user1) {
      console.log('  Found email:', user1.email);
      console.log('  Found role:', user1.role);
    }
    
    // Test direct query
    const user2 = await User.findOne({ email: testEmail.toLowerCase() }).select('+password');
    console.log('\nUsing direct query:', !!user2);
    if (user2) {
      console.log('  Found email:', user2.email);
      console.log('  Found role:', user2.role);
    }
    
    // List all users
    const allUsers = await User.find({}).select('email role');
    console.log('\nAll users in database:');
    allUsers.forEach(u => {
      console.log(`  ${u.email} (${u.role})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testFindByPhoneOrEmail();
