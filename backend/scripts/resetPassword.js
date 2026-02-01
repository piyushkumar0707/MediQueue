import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

mongoose.connect('mongodb://localhost:27017/carequeue');

const resetPassword = async () => {
  try {
    console.log('Resetting password for hackathon20sep@gmail.com...\n');
    
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('New password:', password);
    console.log('New hash:', hashedPassword);
    
    const result = await User.updateOne(
      { email: 'hackathon20sep@gmail.com' },
      { $set: { password: hashedPassword } }
    );
    
    console.log('\n✅ Password updated!');
    console.log('   Matched:', result.matchedCount);
    console.log('   Modified:', result.modifiedCount);
    
    // Verify it works
    console.log('\nVerifying new password...');
    const user = await User.findByPhoneOrEmail('hackathon20sep@gmail.com');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      console.log('✅ Password verification successful!');
      console.log('\n📝 You can now login with:');
      console.log('   Email: hackathon20sep@gmail.com');
      console.log('   Password: password123');
    } else {
      console.log('❌ Password verification failed!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetPassword();
