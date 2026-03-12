import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

await mongoose.connect('mongodb://localhost:27017/carequeue');

const hash = await bcrypt.hash('Test@123', 12);

// Use updateOne to bypass pre-save hook (which would double-hash)
const all = await User.find({}).select('+password');
let fixed = 0;
for (const user of all) {
  if (!user.password) {
    await User.updateOne({ _id: user._id }, { $set: { password: hash } });
    console.log(`✅ Fixed: ${user.email} (${user.role})`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} users. All now have password: Test@123`);
if (fixed === 0) console.log('All users already had passwords set.');
process.exit(0);
