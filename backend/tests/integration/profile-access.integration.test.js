import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import Appointment from '../../src/models/Appointment.js';
import Consent from '../../src/models/Consent.js';
import EmergencyAccess from '../../src/models/EmergencyAccess.js';
import MedicalRecord from '../../src/models/MedicalRecord.js';
import Prescription from '../../src/models/Prescription.js';
import Queue from '../../src/models/Queue.js';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('profile access integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5055';
  const baseUrl = `http://127.0.0.1:${testPort}`;
  // Both routes serve the same profile data, so both must enforce the same rules
  const profilePaths = (id) => [`/api/v1/users/${id}`, `/api/v1/users/patients/${id}`];

  let serverProcess;
  let patient;
  let doctor;

  beforeAll(async () => {
    await connectTestDatabase();

    serverProcess = startServerProcess(backendRoot, {
      PORT: testPort,
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
    });

    await waitForHealth(baseUrl);
  });

  beforeEach(async () => {
    patient = await createUser({ role: 'patient' });
    doctor = await createUser({ role: 'doctor' });
  });

  afterAll(async () => {
    await stopServerProcess(serverProcess);
  });

  const get = (url, user) => fetch(`${baseUrl}${url}`, { headers: createAuthHeader(user) });

  const expectDenied = async (viewer, targetId) => {
    for (const url of profilePaths(targetId)) {
      const response = await get(url, viewer);
      const body = await response.json();
      expect(response.status).toBe(403);
      expect(body.data).toBeUndefined();
    }
  };

  const expectAllowed = async (viewer, targetId) => {
    for (const url of profilePaths(targetId)) {
      const response = await get(url, viewer);
      const body = await response.json();
      // The doctor-only route stays closed to other roles
      if (url.includes('/patients/') && viewer.role !== 'doctor') continue;
      expect(response.status).toBe(200);
      expect(body.data._id).toBe(targetId.toString());
    }
  };

  const appointmentFor = (status) => Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    appointmentDate: new Date('2027-01-15'),
    timeSlot: { startTime: '10:00', endTime: '10:30' },
    reasonForVisit: 'Checkup',
    status,
  });

  const consentFor = (overrides = {}) => Consent.create({
    patient: patient._id,
    doctor: doctor._id,
    ...overrides,
  });

  const emergencyFor = (status) => EmergencyAccess.create({
    doctor: doctor._id,
    patient: patient._id,
    emergencyType: EmergencyAccess.schema.path('emergencyType').enumValues[0],
    justification: 'Patient arrived unconscious and needs urgent review of medical history.',
    status,
  });

  test('a patient cannot view another patient', async () => {
    const otherPatient = await createUser({ role: 'patient' });
    await expectDenied(otherPatient, patient._id);
  });

  test('a patient cannot view a doctor through the general user route', async () => {
    const response = await get(`/api/v1/users/${doctor._id}`, patient);
    expect(response.status).toBe(403);
  });

  test('a user can view their own profile and an admin can view any profile', async () => {
    const admin = await createUser({ role: 'admin' });
    await expectAllowed(patient, patient._id);
    await expectAllowed(admin, patient._id);
  });

  test('a doctor with no link to the patient is denied', async () => {
    await expectDenied(doctor, patient._id);
  });

  test('a doctor cannot create their own access by writing a prescription or uploading a record', async () => {
    await Prescription.collection.insertOne({ patient: patient._id, doctor: doctor._id });
    await MedicalRecord.create({
      patient: patient._id,
      uploadedBy: doctor._id,
      recordType: 'other',
      title: 'Uploaded by doctor',
      files: [],
    });
    await expectDenied(doctor, patient._id);
  });

  test('an appointment gives access unless it was cancelled', async () => {
    const appointment = await appointmentFor('cancelled');
    await expectDenied(doctor, patient._id);

    appointment.status = 'scheduled';
    await appointment.save();
    await expectAllowed(doctor, patient._id);
  });

  test('a queue entry gives access unless it was cancelled', async () => {
    const entry = await Queue.create({
      patient: patient._id,
      doctor: doctor._id,
      queueNumber: 1,
      reasonForVisit: 'Fever',
      status: 'cancelled',
    });
    await expectDenied(doctor, patient._id);

    entry.status = 'waiting';
    await entry.save();
    await expectAllowed(doctor, patient._id);
  });

  test('active consent gives access', async () => {
    await consentFor();
    await expectAllowed(doctor, patient._id);
  });

  test.each([
    ['revoked', { status: 'revoked' }],
    ['expired', { expiresAt: new Date(Date.now() - 60_000) }],
    ['without view permission', { permissions: { canView: false } }],
  ])('consent that is %s does not give access', async (_label, overrides) => {
    await consentFor(overrides);
    await expectDenied(doctor, patient._id);
  });

  test('a current record share gives access and an expired one does not', async () => {
    const record = await MedicalRecord.create({
      patient: patient._id,
      uploadedBy: patient._id,
      recordType: 'other',
      title: 'Shared record',
      files: [],
      sharedWith: [{ doctor: doctor._id, expiresAt: new Date(Date.now() - 60_000) }],
    });
    await expectDenied(doctor, patient._id);

    record.sharedWith[0].expiresAt = null;
    await record.save();
    await expectAllowed(doctor, patient._id);
  });

  test('emergency access counts only once it is active', async () => {
    const request = await emergencyFor('pending');
    await expectDenied(doctor, patient._id);

    request.status = 'active';
    await request.save();
    await expectAllowed(doctor, patient._id);
  });

  test('an invalid id is reported as not found to an admin', async () => {
    const admin = await createUser({ role: 'admin' });
    const response = await get('/api/v1/users/not-an-id', admin);
    expect(response.status).toBe(404);
  });

  test('a doctor is denied for an id that does not exist', async () => {
    await expectDenied(doctor, new mongoose.Types.ObjectId());
  });
});
