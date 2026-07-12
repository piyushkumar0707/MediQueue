import 'dotenv/config';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import Appointment from '../src/models/Appointment.js';
import Queue from '../src/models/Queue.js';
import Prescription from '../src/models/Prescription.js';
import Consent from '../src/models/Consent.js';
import mongoose from 'mongoose';

await connectDB();
const validIds = new Set((await User.find().select('_id')).map(u => u._id.toString()));
const isOrphan = (id) => id && !validIds.has(id.toString());

for (const model of [Appointment, Queue, Prescription, Consent]) {
  const docs = await model.find();
  let removed = 0;
  for (const d of docs) {
    if (isOrphan(d.patient) || isOrphan(d.doctor)) { await d.deleteOne(); removed++; }
  }
  console.log(`${model.modelName}: removed ${removed}`);
}
await mongoose.connection.close();
