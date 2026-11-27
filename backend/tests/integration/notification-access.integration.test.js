import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Notification from '../../src/models/Notification.js';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('notification creation access integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5055';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;
  let patient;
  let otherPatient;

  beforeAll(async () => {
    await connectTestDatabase();

    serverProcess = startServerProcess(backendRoot, {
      PORT: testPort,
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      // Keep the test from sending real messages
      EMAIL_HOST: '',
      EMAIL_USER: '',
      EMAIL_PASSWORD: '',
      TWILIO_ACCOUNT_SID: '',
      TWILIO_AUTH_TOKEN: '',
      TWILIO_PHONE_NUMBER: '',
    });

    await waitForHealth(baseUrl);
  });

  beforeEach(async () => {
    patient = await createUser({ role: 'patient' });
    otherPatient = await createUser({ role: 'patient' });
  });

  afterAll(async () => {
    await stopServerProcess(serverProcess);
  });

  const send = (sender, overrides) => fetch(`${baseUrl}/api/v1/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...createAuthHeader(sender) },
    body: JSON.stringify({
      type: 'system_alert',
      title: 'Test notification',
      message: 'Test message',
      ...overrides,
    }),
  });

  const expectDenied = async (sender, overrides) => {
    const response = await send(sender, overrides);
    expect(response.status).toBe(403);
    // Scoped to the sender: cleanup only clears collections this file's process has loaded
    expect(await Notification.countDocuments({ sender: sender._id })).toBe(0);
  };

  test.each(['patient', 'doctor'])('a %s cannot notify another user', async (role) => {
    const sender = await createUser({ role });
    await expectDenied(sender, { recipient: otherPatient._id.toString() });
  });

  test('a recipient wrapped in a list is rejected', async () => {
    await expectDenied(patient, { recipient: [patient._id.toString()] });
  });

  test.each([
    ['email', { inApp: true, email: true }],
    ['SMS', { inApp: true, sms: true }],
    ['email sent as text', { email: 'yes' }],
  ])('a non-admin cannot send %s, even to themselves', async (_label, channels) => {
    await expectDenied(patient, { recipient: patient._id.toString(), channels });
  });

  test('a user can send an in-app notification to themselves', async () => {
    const response = await send(patient, {
      recipient: patient._id.toString(),
      channels: { inApp: true, email: false, sms: false },
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.recipient).toBe(patient._id.toString());
    expect(body.data.channels).toMatchObject({ inApp: true, email: false, sms: false });
  });

  test('an admin can notify another user by email and SMS', async () => {
    const admin = await createUser({ role: 'admin' });
    const response = await send(admin, {
      recipient: otherPatient._id.toString(),
      channels: { inApp: true, email: true, sms: true },
    });

    expect(response.status).toBe(201);
    expect(await Notification.countDocuments({ recipient: otherPatient._id })).toBe(1);
  });
});
