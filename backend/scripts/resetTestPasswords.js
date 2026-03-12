import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

await mongoose.connect('mongodb://localhost:27017/carequeue');

const hash = await bcrypt.hash('Test@123', 12);

// Force-reset these accounts that were double-hashed in the previous run
const emails = [
  'doctor@test.com',
  'patient@test.com',
  'dr.sarah@hospital.com',
  'memesyou709@gmail.com',
  'hackathon06sep@gmail.com',
  'user1@gmail.com',
  'patient1@test.com',
  'doctor1@test.com',
  'patient4@test.com',
  'patient5@test.com',
];

for (const email of emails) {
  // Use raw collection update to bypass ALL Mongoose middleware
  const r = await User.collection.updateOne({ email }, { $set: { password: hash } });
  console.log(`${email}: ${r.modifiedCount ? '✅ RESET' : '⚠️  not found'}`);
}

// Verify
for (const email of ['doctor@test.com', 'patient@test.com', 'admin@test.com']) {
  const user = await User.findOne({ email }).select('+password');
  if (!user) { console.log(`${email}: NOT IN DB`); continue; }
  const ok = await bcrypt.compare('Test@123', user.password || '');
  console.log(`\nVerify ${email}: ${ok ? '✅ Login works' : '❌ Still broken'}`);
}

console.log('\nAll done. Credentials: Test@123');
process.exit(0);
