import mongoose from 'mongoose';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carequeue');
    console.log('✅ Connected to MongoDB\n');

    const phoneNumber = '8968140842';
    const user = await User.findByPhoneOrEmail(phoneNumber);
    
    console.log(`Searching for phone: ${phoneNumber}`);
    console.log('Result:', user ? 'FOUND' : 'NOT FOUND');
    
    if (user) {
      console.log('\nUser Details:');
      console.log(`  Name: ${user.personalInfo?.firstName} ${user.personalInfo?.lastName}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Phone: ${user.phoneNumber}`);
      console.log(`  Role: ${user.role}`);
    } else {
      console.log('\n❌ No user found with this phone number');
      console.log('\nSearching all users with similar phone...');
      
      const similarUsers = await User.find({
        phoneNumber: { $regex: '8968140842' }
      }).select('email phoneNumber personalInfo.firstName personalInfo.lastName');
      
      console.log(`Found ${similarUsers.length} users with similar phone`);
      similarUsers.forEach(u => {
        console.log(`  - ${u.phoneNumber} (${u.email})`);
      });
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
};

checkUser();
