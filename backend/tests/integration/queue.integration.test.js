import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Queue from '../../src/models/Queue.js';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('queue integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5055';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;
  let patient;
  let patientHeaders;
  let doctor;
  let doctorHeaders;

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

    patientHeaders = createAuthHeader(patient);
    doctorHeaders = createAuthHeader(doctor);
  });

  afterAll(async () => {
    await stopServerProcess(serverProcess);
  });

  test('patient can join queue for a doctor', async () => {
    const response = await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...patientHeaders,
      },
      body: JSON.stringify({
        doctorId: doctor._id.toString(),
        reasonForVisit: 'Recurring headache',
        priority: 'normal',
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('waiting');
    expect(body.data.priority).toBe('normal');
    expect(body.data.queueNumber).toBe(1);
  });

  test('doctor can view queue after patient joins', async () => {
    await fetch(`${baseUrl}/api/v1/queue/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...patientHeaders,
      },
      body: JSON.stringify({
        doctorId: doctor._id.toString(),
        reasonForVisit: 'Fever and body ache',
        priority: 'urgent',
      }),
    });

    const doctorQueueResponse = await fetch(`${baseUrl}/api/v1/queue/doctor-queue`, {
      headers: doctorHeaders,
    });

    const doctorQueueBody = await doctorQueueResponse.json();

    expect(doctorQueueResponse.status).toBe(200);
    expect(doctorQueueBody.success).toBe(true);
    expect(Array.isArray(doctorQueueBody.data)).toBe(true);
    expect(doctorQueueBody.data.length).toBe(1);
    expect(doctorQueueBody.data[0].priority).toBe('urgent');
    expect(doctorQueueBody.data[0].position).toBe(1);
  });

  test('doctor call-next prioritizes emergency over normal', async () => {
    const patient2 = await createUser({ role: 'patient' });

    await Queue.create({
      patient: patient._id,
      doctor: doctor._id,
      queueNumber: 1,
      reasonForVisit: 'Mild cold symptoms',
      priority: 'normal',
    });

    await Queue.create({
      patient: patient2._id,
      doctor: doctor._id,
      queueNumber: 2,
      reasonForVisit: 'Severe chest pain',
      priority: 'emergency',
    });

    const callNextResponse = await fetch(`${baseUrl}/api/v1/queue/call-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...doctorHeaders,
      },
      body: JSON.stringify({ consultationRoom: 'Room 2' }),
    });

    const callNextBody = await callNextResponse.json();

    expect(callNextResponse.status).toBe(200);
    expect(callNextBody.success).toBe(true);
    expect(callNextBody.data.status).toBe('in-progress');
    expect(callNextBody.data.priority).toBe('emergency');
    expect(callNextBody.data.consultationRoom).toBe('Room 2');

    const updatedNormalEntry = await Queue.findOne({
      patient: patient._id,
      doctor: doctor._id,
      priority: 'normal',
    });

    expect(updatedNormalEntry.status).toBe('waiting');
  });
});
