import path from 'node:path';
import { fileURLToPath } from 'node:url';
import MedicalRecord from '../../src/models/MedicalRecord.js';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { clearRedis } from '../helpers/redis.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('negative path integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5055';
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

  beforeEach(async () => {
    // Flush Redis before each test so stale rate-limit keys from other
    // parallel suites or previous runs don't leak in.
    await clearRedis();
  });

  test('login with invalid credentials returns 401', async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneOrEmail: 'missing.user@example.com',
        password: 'Password@123',
      }),
    });

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
  });

  test('register complete with wrong OTP returns 400', async () => {
    const email = 'otp.flow@example.com';

    const initiateResponse = await fetch(`${baseUrl}/api/v1/auth/register/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '9876543210',
        countryCode: '+91',
        email,
      }),
    });

    const initiateBody = await initiateResponse.json();
    expect(initiateResponse.status).toBe(200);
    expect(initiateBody.success).toBe(true);

    const completeResponse = await fetch(`${baseUrl}/api/v1/auth/register/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: initiateBody.sessionId,
        otp: '000000',
        role: 'patient',
        personalInfo: {
          firstName: 'Otp',
          lastName: 'Failure',
          dateOfBirth: '1995-01-01',
          gender: 'other',
        },
        password: 'Password@123',
      }),
    });

    const completeBody = await completeResponse.json();

    expect(completeResponse.status).toBe(400);
    expect(completeBody.success).toBe(false);
  });

  test('login route is rate-limited after repeated failed attempts', async () => {
    const statuses = [];
    // loginLimiter max is 15 — send 14 requests that should all be 401,
    // then the 15th should trigger 429.
    const maxRequests = 14;

    for (let i = 0; i < maxRequests + 1; i += 1) {
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneOrEmail: 'rate.limit@example.com',
          password: 'Password@123',
        }),
      });

      statuses.push(response.status);
    }

    expect(statuses.slice(0, maxRequests).every((status) => status === 401)).toBe(true);
    expect(statuses[maxRequests]).toBe(429);
  });

  test('doctor without consent cannot access patient record by id', async () => {
    const patient = await createUser({ role: 'patient' });
    const doctor = await createUser({ role: 'doctor' });

    const record = await MedicalRecord.create({
      patient: patient._id,
      uploadedBy: patient._id,
      recordType: 'other',
      title: 'Private Record',
      description: 'Should not be visible to unrelated doctor',
      recordDate: new Date('2025-01-01'),
      files: [
        {
          fileName: 'record.pdf',
          fileUrl: 'https://example.com/record.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
        },
      ],
      status: 'active',
    });

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id.toString()}`, {
      headers: createAuthHeader(doctor),
    });

    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.success).toBe(false);
  });
});
