import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import Appointment from '../src/models/Appointment.js';
import Queue from '../src/models/Queue.js';
import MedicalRecord from '../src/models/MedicalRecord.js';
import Prescription from '../src/models/Prescription.js';
import QueueCounter from '../src/models/QueueCounter.js';
import { demoUserEmails } from './factories/demoUsers.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();

    const demoUsers = await User.find({ email: { $in: demoUserEmails } }).select('_id');
    const demoUserIds = demoUsers.map((u) => u._id);

    const [appointmentsResult, queueResult, recordsResult, prescriptionsResult, usersResult, queueCounterResult] = await Promise.all([
      Appointment.deleteMany({ notes: { $regex: '^DEMO_SEED:' } }),
      Queue.deleteMany({ notes: { $regex: '^DEMO_SEED:' } }),
      MedicalRecord.deleteMany({ 'metadata.tags': { $regex: '^DEMO_SEED:' } }),
      Prescription.deleteMany({ notes: { $regex: '^DEMO_SEED:' } }),
      User.deleteMany({ email: { $in: demoUserEmails } }),
      QueueCounter.deleteMany({ doctorId: { $in: demoUserIds } }),
    ]);

    console.log('Demo reset summary');
    console.log('------------------');
    console.log(`Appointments deleted: ${appointmentsResult.deletedCount}`);
    console.log(`Queue entries deleted: ${queueResult.deletedCount}`);
    console.log(`Records deleted: ${recordsResult.deletedCount}`);
    console.log(`Prescriptions deleted: ${prescriptionsResult.deletedCount}`);
    console.log(`Users deleted: ${usersResult.deletedCount}`);
    console.log(`Queue counters deleted: ${queueCounterResult.deletedCount}`);
  } catch (error) {
    console.error('Demo reset failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
