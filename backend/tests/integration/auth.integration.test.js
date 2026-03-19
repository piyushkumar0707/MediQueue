import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { clearDatabase } from '../helpers/database.js';
import { createUser } from '../factories/userFactory.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('auth integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5055';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;

  beforeAll(async () => {
    await connectTestDatabase();
    await clearDatabase();

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

  test('GET /api/v1/auth/me returns 401 without token', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/me`);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  test('POST /api/v1/auth/login returns token and grants /auth/me access', async () => {
    const user = await createUser({
      email: 'auth.integration@example.com',
      phoneNumber: '9123456789',
      role: 'patient',
      personalInfo: {
        firstName: 'Auth',
        lastName: 'Integration',
        dateOfBirth: new Date('1996-06-20'),
        gender: 'other',
      },
    });

    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneOrEmail: user.email,
        password: 'Password@123',
      }),
    });

    const loginBody = await loginResponse.json();

    expect(loginResponse.status).toBe(200);
    expect(loginBody.success).toBe(true);
    expect(loginBody.data).toHaveProperty('accessToken');

    const meResponse = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginBody.data.accessToken}`,
      },
    });

    const meBody = await meResponse.json();

    expect(meResponse.status).toBe(200);
    expect(meBody.success).toBe(true);
    expect(meBody.data.user.email).toBe('auth.integration@example.com');
    expect(meBody.data.user.role).toBe('patient');
  });
});
