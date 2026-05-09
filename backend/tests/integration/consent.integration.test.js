import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('consent grant integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5056';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;
  let patientHeaders;
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
    const patient = await createUser({ role: 'patient' });
    doctor = await createUser({
      role: 'doctor',
      professionalInfo: {
        licenseNumber: `LIC-${Date.now()}`,
        specialty: 'General Medicine',
        qualifications: ['MBBS'],
      },
    });

    patientHeaders = createAuthHeader(patient);
  });

  afterAll(async () => {
    await stopServerProcess(serverProcess);
  });

  test('grants consent when expiresAt is omitted', async () => {
    const response = await fetch(`${baseUrl}/api/v1/consent/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...patientHeaders,
      },
      body: JSON.stringify({
        doctorId: doctor._id.toString(),
        scope: 'all-records',
        permissions: {
          canView: true,
          canDownload: true,
          canShare: false,
        },
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.scope).toBe('all-records');
    expect(body.data.expiresAt).toBeNull();
  });

  test('grants consent when expiresAt is null', async () => {
    const response = await fetch(`${baseUrl}/api/v1/consent/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...patientHeaders,
      },
      body: JSON.stringify({
        doctorId: doctor._id.toString(),
        scope: 'all-records',
        expiresAt: null,
        permissions: {
          canView: true,
          canDownload: true,
          canShare: false,
        },
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.expiresAt).toBeNull();
  });

  test('grants consent when expiresAt is empty string', async () => {
    const response = await fetch(`${baseUrl}/api/v1/consent/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...patientHeaders,
      },
      body: JSON.stringify({
        doctorId: doctor._id.toString(),
        scope: 'all-records',
        expiresAt: '',
        permissions: {
          canView: true,
          canDownload: true,
          canShare: false,
        },
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.expiresAt).toBeNull();
  });
});
