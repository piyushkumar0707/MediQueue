import mongoose from 'mongoose';
import User from '../src/models/User.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediqueue');

const deleteAndReseedUsers = async () => {
  try {
    console.log('🗑️  Deleting existing test users...\n');
    
    // Delete existing test users
    await User.deleteMany({
      email: { $in: ['admin@test.com', 'doctor@test.com', 'patient@test.com'] }
    });
    
    console.log('✅ Test users deleted\n');
    console.log('🌱 Now run: node backend/scripts/seedUsers.js\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

deleteAndReseedUsers();
