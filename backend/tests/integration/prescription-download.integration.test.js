import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Prescription from '../../src/models/Prescription.js';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('prescription download integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5057';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;

  beforeAll(async () => {
    await connectTestDatabase();

    serverProcess = startServerProcess(backendRoot, {
      PORT: testPort,
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
    });

    await waitForHealth(baseUrl);
  });

  afterAll(async () => {
    await stopServerProcess(serverProcess);
  });

  test('patient downloads prescription PDF with expected attachment headers', async () => {
    const patient = await createUser({ role: 'patient' });
    const doctor = await createUser({
      role: 'doctor',
      professionalInfo: {
        specialty: 'General Physician',
        licenseNumber: 'LIC-INT-001',
      },
    });

    const prescription = await Prescription.create({
      patient: patient._id,
      doctor: doctor._id,
      diagnosis: 'Seasonal viral fever',
      medicines: [
        {
          name: 'Paracetamol',
          dosage: '500mg',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'Take after food',
        },
      ],
      notes: 'Hydrate and take rest.',
      followUpDate: new Date('2026-03-27T00:00:00.000Z'),
      followUpInstructions: 'Follow up if symptoms persist.',
    });

    const response = await fetch(`${baseUrl}/api/v1/prescriptions/${prescription._id.toString()}/download`, {
      headers: createAuthHeader(patient),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('attachment;');
    expect(response.headers.get('content-disposition')).toContain('.pdf');

    const body = await response.arrayBuffer();
    expect(body.byteLength).toBeGreaterThan(1000);
  });

  test('unrelated patient cannot download another patient prescription', async () => {
    const patient = await createUser({ role: 'patient' });
    const unauthorizedPatient = await createUser({ role: 'patient' });
    const doctor = await createUser({
      role: 'doctor',
      professionalInfo: {
        specialty: 'General Physician',
        licenseNumber: 'LIC-INT-002',
      },
    });

    const prescription = await Prescription.create({
      patient: patient._id,
      doctor: doctor._id,
      diagnosis: 'Acid reflux',
      medicines: [
        {
          name: 'Pantoprazole',
          dosage: '40mg',
          frequency: 'Once daily',
          duration: '10 days',
          instructions: 'Before breakfast',
        },
      ],
    });

    const response = await fetch(`${baseUrl}/api/v1/prescriptions/${prescription._id.toString()}/download`, {
      headers: createAuthHeader(unauthorizedPatient),
    });

    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody.success).toBe(false);
  });
});
