import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('role-based access control integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5055';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;
  let patientHeaders;
  let doctorHeaders;
  let adminHeaders;

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
    const doctor = await createUser({ role: 'doctor' });
    const admin = await createUser({ role: 'admin' });

    patientHeaders = createAuthHeader(patient);
    doctorHeaders = createAuthHeader(doctor);
    adminHeaders = createAuthHeader(admin);
  });

  afterAll(async () => {
    await stopServerProcess(serverProcess);
  });

  test('GET /api/v1/admin/stats returns 401 without token', async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/stats`);
    expect(response.status).toBe(401);
  });

  test('patient token cannot access admin stats', async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: patientHeaders,
    });

    expect(response.status).toBe(403);
  });

  test('admin token can access admin stats', async () => {
    const response = await fetch(`${baseUrl}/api/v1/admin/stats`, {
      headers: adminHeaders,
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('users');
  });

  test('patient token cannot access doctor queue endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/queue/doctor-queue`, {
      headers: patientHeaders,
    });

    expect(response.status).toBe(403);
  });

  test('doctor token can access doctor queue endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/queue/doctor-queue`, {
      headers: doctorHeaders,
    });

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('doctor token cannot access patient queue status endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/queue/my-status`, {
      headers: doctorHeaders,
    });

    expect(response.status).toBe(403);
  });

  test('patient token can access patient queue status endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/v1/queue/my-status`, {
      headers: patientHeaders,
    });

    const body = await response.json();

    // No active queue entry exists in this test setup, so 404 is expected.
    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
  });
});
