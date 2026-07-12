import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import { seedDemoUsers } from './factories/demoUsers.js';
import { seedDemoAppointments, demoAppointmentMarkers } from './factories/demoAppointments.js';
import { seedDemoQueue } from './factories/demoQueue.js';
import { seedDemoRecords } from './factories/demoRecords.js';
import { seedDemoPrescriptions } from './factories/demoPrescriptions.js';

dotenv.config();

const printSummary = (sections, credentials) => {
  console.log('');
  console.log('Demo seed summary');
  console.log('-----------------');
  for (const section of sections) {
    console.log(`${section.name}: created=${section.created}, updated=${section.updated}`);
  }
  console.log('');
  console.log('Demo credentials');
  console.log('----------------');
  console.log(`Patient: ${credentials.patient.email} / ${credentials.patient.password}`);
  console.log(`Doctor:  ${credentials.doctor.email} / ${credentials.doctor.password}`);
  console.log(`Admin:   ${credentials.admin.email} / ${credentials.admin.password}`);
  console.log('');
};

const run = async () => {
  try {
    await connectDB();

    const usersResult = await seedDemoUsers();
    const appointmentResult = await seedDemoAppointments({
      patient: usersResult.users.patient,
      doctor: usersResult.users.doctor,
    });

    const queueResult = await seedDemoQueue({
      patient: usersResult.users.patient,
      doctor: usersResult.users.doctor,
      appointment: appointmentResult.appointments[demoAppointmentMarkers.upcoming],
    });

    const recordsResult = await seedDemoRecords({
      patient: usersResult.users.patient,
      doctor: usersResult.users.doctor,
      admin: usersResult.users.admin,
    });

    const prescriptionResult = await seedDemoPrescriptions({
      patient: usersResult.users.patient,
      doctor: usersResult.users.doctor,
      appointment: appointmentResult.appointments[demoAppointmentMarkers.completed],
      queueEntry: queueResult.queue,
    });

    printSummary(
      [
        { name: 'Users', created: usersResult.created, updated: usersResult.updated },
        { name: 'Appointments', created: appointmentResult.created, updated: appointmentResult.updated },
        { name: 'Queue', created: queueResult.created, updated: queueResult.updated },
        { name: 'Records', created: recordsResult.created, updated: recordsResult.updated },
        { name: 'Prescriptions', created: prescriptionResult.created, updated: prescriptionResult.updated },
      ],
      usersResult.credentials
    );
  } catch (error) {
    console.error('Demo seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
