import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Consent from '../../src/models/Consent.js';
import MedicalRecord from '../../src/models/MedicalRecord.js';
import { startServerProcess, stopServerProcess, waitForHealth } from '../helpers/serverProcess.js';
import { connectTestDatabase } from '../helpers/mongoose.js';
import { createUser } from '../factories/userFactory.js';
import { createAuthHeader } from '../helpers/auth.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('record access policy integration', () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backendRoot = path.resolve(__dirname, '../..');
  const testPort = process.env.TEST_SERVER_PORT || '5057';
  const baseUrl = `http://127.0.0.1:${testPort}`;

  let serverProcess;
  let patient;
  let doctor;
  let patientHeaders;
  let doctorHeaders;

  beforeAll(async () => {
    await connectTestDatabase();
    serverProcess = startServerProcess(backendRoot, {
      PORT: testPort,
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AI_FEATURE_SUMMARIZE: 'true',
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

  const createRecord = (overrides = {}) => MedicalRecord.create({
    patient: patient._id,
    uploadedBy: patient._id,
    recordType: 'lab-report',
    title: 'Policy test record',
    recordDate: new Date('2025-01-01'),
    files: [{
      fileName: 'test.pdf',
      fileUrl: 'https://example.com/test.pdf',
      fileType: 'application/pdf',
      fileSize: 256,
    }],
    status: 'active',
    ...overrides,
  });

  const createConsent = (overrides = {}) => Consent.create({
    patient: patient._id,
    doctor: doctor._id,
    scope: 'all-records',
    permissions: { canView: true, canDownload: true, canShare: false },
    status: 'active',
    expiresAt: null,
    ...overrides,
  });

  test('denies record details when canView is false', async () => {
    const record = await createRecord();
    await createConsent({ permissions: { canView: false, canDownload: true, canShare: false } });

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id}`, { headers: doctorHeaders });
    expect(response.status).toBe(403);
  });

  test('denies file download when canDownload is false', async () => {
    const record = await createRecord();
    await createConsent({ permissions: { canView: true, canDownload: false, canShare: false } });

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id}/view-file?download=true`, {
      headers: doctorHeaders,
    });
    expect(response.status).toBe(403);
  });

  test('denies expired consent', async () => {
    const record = await createRecord();
    await createConsent({ expiresAt: new Date(Date.now() - 60_000) });

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id}`, { headers: doctorHeaders });
    expect(response.status).toBe(403);
  });

  test('denies revoked consent', async () => {
    const record = await createRecord();
    await createConsent({ status: 'revoked' });

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id}`, { headers: doctorHeaders });
    expect(response.status).toBe(403);
  });

  test('denies consent outside its specific-record scope', async () => {
    const record = await createRecord();
    const otherRecord = await createRecord({ title: 'Different scoped record' });
    await createConsent({
      scope: 'specific-records',
      specificRecords: [otherRecord._id],
    });

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id}`, { headers: doctorHeaders });
    expect(response.status).toBe(403);
  });

  test('allows valid consent scoped to the requested record', async () => {
    const record = await createRecord();
    await createConsent({
      scope: 'specific-records',
      specificRecords: [record._id],
    });

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id}`, { headers: doctorHeaders });
    expect(response.status).toBe(200);
  });

  test('preserves owner access', async () => {
    const record = await createRecord();

    const response = await fetch(`${baseUrl}/api/v1/records/${record._id}`, { headers: patientHeaders });
    expect(response.status).toBe(200);
  });

  test('AI summarization denies canView false and allows a valid scoped consent to reach file validation', async () => {
    const deniedRecord = await createRecord({ files: [] });
    await createConsent({
      permissions: { canView: false, canDownload: true, canShare: false },
    });
    const deniedResponse = await fetch(`${baseUrl}/api/v1/records/${deniedRecord._id}/summarize`, {
      method: 'POST',
      headers: doctorHeaders,
    });
    expect(deniedResponse.status).toBe(403);

    const allowedRecord = await createRecord({ files: [] });
    await createConsent({
      scope: 'specific-records',
      specificRecords: [allowedRecord._id],
    });
    const allowedResponse = await fetch(`${baseUrl}/api/v1/records/${allowedRecord._id}/summarize`, {
      method: 'POST',
      headers: doctorHeaders,
    });
    expect(allowedResponse.status).toBe(400);
    expect((await allowedResponse.json()).message).toMatch(/no attached files/i);
  });

  test('consent-filtered list excludes records when canView is false', async () => {
    const record = await createRecord();
    await createConsent({ permissions: { canView: false, canDownload: true, canShare: false } });

    const response = await fetch(`${baseUrl}/api/v1/records/shared-with-me?recordType=lab-report`, { headers: doctorHeaders });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(0);

    const patientRecordsResponse = await fetch(
      `${baseUrl}/api/v1/records/patient/${patient._id}?recordType=lab-report`,
      { headers: doctorHeaders },
    );
    const patientRecordsBody = await patientRecordsResponse.json();
    expect(patientRecordsResponse.status).toBe(200);
    expect(patientRecordsBody.data).toHaveLength(0);
  });
});
