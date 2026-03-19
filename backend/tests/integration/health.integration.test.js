import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('health endpoint integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');

  const testPort = process.env.TEST_SERVER_PORT || '5055';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;

  beforeAll(async () => {
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

  test('GET /health responds with expected shape', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect([200, 503]).toContain(response.status);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('mongodb');
    expect(body.checks).toHaveProperty('redis');
  });
});
