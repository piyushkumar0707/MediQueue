import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import { seedDemoUsers } from './factories/demoUsers.js';
import { seedDemoAppointments } from './factories/demoAppointments.js';
import { seedDemoQueue } from './factories/demoQueue.js';
import { seedDemoRecords } from './factories/demoRecords.js';
import { seedDemoPrescriptions } from './factories/demoPrescriptions.js';

dotenv.config();

// ── Production guard ────────────────────────────────────────────────────────
// This script WIPES the entire database before seeding.
// It MUST NOT be run against production unless NODE_ENV=seed-override is set.
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || '';
const isProd = MONGO_URI.includes('mongodb.net') && process.env.NODE_ENV !== 'seed-override';

if (isProd) {
  console.error('\n╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ⛔  ABORTED — Production database detected.                ║');
  console.error('║                                                              ║');
  console.error('║  This script wipes ALL data. It must NOT run on Atlas prod. ║');
  console.error('║  To override: NODE_ENV=seed-override node nuke-and-seed.mjs ║');
  console.error('╚══════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}

const printSummary = (sections, credentials) => {
  console.log('\n══════════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('══════════════════════════════════════════════');
  for (const s of sections) {
    console.log(`  ✓ ${s.name.padEnd(16)} created=${s.created}  updated=${s.updated}`);
  }
  console.log('\n  Demo Credentials (all passwords: DemoPass@123)');
  console.log('  ─────────────────────────────────────────────');
  for (const [role, cred] of Object.entries(credentials)) {
    console.log(`  [${role.padEnd(14)}]  ${cred.email}`);
  }
  console.log('══════════════════════════════════════════════\n');
};

const run = async () => {
  try {
    await connectDB();

    console.log('\nFetching collections to wipe...');
    const collections = await mongoose.connection.db.collections();
    console.log(`Found ${collections.length} collections. Wiping all data...`);
    for (const col of collections) {
      if (col.collectionName.startsWith('system.')) continue;
      const r = await col.deleteMany({});
      console.log(`  Wiped: ${col.collectionName} (${r.deletedCount} docs)`);
    }
    console.log('Database wipe complete.\n');

    console.log('Seeding users...');
    const usersResult = await seedDemoUsers();
    const u = usersResult.users;

    console.log('Seeding appointments...');
    const appointmentResult = await seedDemoAppointments({
      patient:      u.patient,
      patientRohan: u.patientRohan,
      patientFatima:u.patientFatima,
      patientSuresh:u.patientSuresh,
      patientAnanya:u.patientAnanya,
      doctorGeneral:u.doctorGeneral,
      doctorCardio: u.doctorCardio,
      doctorOrtho:  u.doctorOrtho,
    });

    console.log('Seeding queue...');
    const upcomingAppt = appointmentResult.appointments['DEMO:appt:aarav-upcoming'];
    const queueResult = await seedDemoQueue({
      patient:    u.patient,
      doctor:     u.doctorGeneral,
      appointment: upcomingAppt,
    });

    console.log('Seeding medical records...');
    const recordsResult = await seedDemoRecords({
      patient:      u.patient,
      patientRohan: u.patientRohan,
      patientFatima:u.patientFatima,
      patientSuresh:u.patientSuresh,
      patientAnanya:u.patientAnanya,
      doctorGeneral:u.doctorGeneral,
      doctorCardio: u.doctorCardio,
      doctorOrtho:  u.doctorOrtho,
      admin:        u.admin,
    });

    console.log('Seeding prescriptions...');
    const prescriptionResult = await seedDemoPrescriptions({
      patient:      u.patient,
      patientRohan: u.patientRohan,
      patientFatima:u.patientFatima,
      patientSuresh:u.patientSuresh,
      patientAnanya:u.patientAnanya,
      doctorGeneral:u.doctorGeneral,
      doctorCardio: u.doctorCardio,
      doctorOrtho:  u.doctorOrtho,
    });

    printSummary(
      [
        { name: 'Users',         created: usersResult.created,      updated: usersResult.updated },
        { name: 'Appointments',  created: appointmentResult.created, updated: appointmentResult.updated },
        { name: 'Queue entries', created: queueResult.created,      updated: queueResult.updated },
        { name: 'Med Records',   created: recordsResult.created,    updated: recordsResult.updated },
        { name: 'Prescriptions', created: prescriptionResult.created,updated: prescriptionResult.updated },
      ],
      usersResult.credentials,
    );
  } catch (error) {
    console.error('\n✘ Seeding failed:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

run();
