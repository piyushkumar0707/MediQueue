import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const records = new Map();
const ciphertextObjects = new Map();
const patient = { _id: new mongoose.Types.ObjectId(), role: 'patient' };
let failUploadAt = null;
let failRecordSave = false;
let uploadCalls = 0;

class FakeMedicalRecord {
  constructor(data) {
    this._id = new mongoose.Types.ObjectId();
    Object.assign(this, data);
    this.files = (data.files || []).map((file) => ({ ...file, _id: new mongoose.Types.ObjectId() }));
  }

  async save() {
    if (failRecordSave) throw new Error('simulated database save failure');
    records.set(this._id.toString(), this);
    return this;
  }

  async populate() { return this; }
  async logAccess() { return this; }
  async canUserAccess(userId) { return this.patient.toString() === userId.toString(); }

  static findById(id) {
    return { select: async () => records.get(id.toString()) || null };
  }
}

const uploadEncryptedBuffer = jest.fn(async (buffer, publicId) => {
  uploadCalls += 1;
  if (failUploadAt === uploadCalls) throw new Error('simulated Cloudinary upload failure');
  ciphertextObjects.set(publicId, Buffer.from(buffer));
  return { public_id: publicId, secure_url: `https://res.cloudinary.com/test/raw/upload/${publicId}` };
});
const deleteFile = jest.fn(async (publicId) => ciphertextObjects.delete(publicId));
const axiosGet = jest.fn(async (url) => {
  const publicId = url.replace('mock-cloudinary://', '');
  const bytes = ciphertextObjects.get(publicId);
  if (!bytes) throw new Error('stored object not found');
  return { data: Buffer.from(bytes) };
});

const backendSrc = path.resolve(process.cwd(), 'src');
jest.unstable_mockModule(path.join(backendSrc, 'models/MedicalRecord.js'), () => ({ default: FakeMedicalRecord }));
jest.unstable_mockModule(path.join(backendSrc, 'models/User.js'), () => ({ default: { findById: jest.fn(async () => patient) } }));
jest.unstable_mockModule(path.join(backendSrc, 'models/Consent.js'), () => ({ default: { findOne: jest.fn(async () => null) } }));
jest.unstable_mockModule(path.join(backendSrc, 'models/EmergencyAccess.js'), () => ({ default: {} }));
jest.unstable_mockModule(path.join(backendSrc, 'middleware/upload.js'), () => ({
  deleteFile,
  uploadEncryptedBuffer,
}));
jest.unstable_mockModule(path.join(backendSrc, 'config/cloudinary.js'), () => ({
  default: { utils: { private_download_url: (publicId) => `mock-cloudinary://${publicId}` } },
}));
jest.unstable_mockModule('axios', () => ({ default: { get: axiosGet } }));

const controllerUrl = pathToFileURL(path.join(backendSrc, 'controllers/recordController.js')).href;
const { uploadRecord, getFileViewUrl } = await import(controllerUrl);
const { validateEnv } = await import(pathToFileURL(path.join(backendSrc, 'config/validateEnv.js')).href);

const invokeRoute = (handler, req) => new Promise((resolve, reject) => {
  const result = { statusCode: 200, body: undefined, headers: {}, bytes: undefined };
  const res = {
    status(code) { result.statusCode = code; return this; },
    json(body) { result.body = body; resolve(result); return this; },
    setHeader(name, value) { result.headers[name.toLowerCase()] = value; return this; },
    send(bytes) { result.bytes = Buffer.from(bytes); resolve(result); return this; },
  };
  handler(req, res, (error) => error ? reject(error) : resolve(result));
});

const uploadRequest = (files, overrides = {}) => ({
  body: {
    patientId: patient._id.toString(),
    recordType: 'lab-report',
    title: 'Test result',
    ...overrides.body,
  },
  files,
  user: { userId: patient._id.toString(), role: 'patient' },
  ip: '127.0.0.1',
  ...overrides,
});

const viewRequest = (recordId, overrides = {}) => ({
  params: { id: recordId },
  query: { fileIndex: '0' },
  user: { userId: patient._id.toString(), role: 'patient' },
  ...overrides,
});

describe('medical record file encryption flow', () => {
  beforeEach(() => {
    records.clear();
    ciphertextObjects.clear();
    failUploadAt = null;
    failRecordSave = false;
    uploadCalls = 0;
    jest.clearAllMocks();
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
  });

  test('startup validation rejects an encryption key that is not 32 bytes', () => {
    process.env.ENCRYPTION_KEY = 'x'.repeat(31);
    expect(() => validateEnv()).toThrow('ENCRYPTION_KEY must be configured and exactly 32 bytes');
  });

  test('stores ciphertext and serves the original bytes to an authorized patient', async () => {
    const original = Buffer.from('confidential lab result: HGB 13.2');
    const uploaded = await invokeRoute(uploadRecord, uploadRequest([{
      originalname: 'lab-result.txt',
      mimetype: 'text/plain',
      size: original.length,
      buffer: original,
    }]));

    expect(uploaded.statusCode).toBe(201);
    const record = uploaded.body.data;
    const file = record.files[0];
    const storedCiphertext = ciphertextObjects.get(file.cloudinaryPublicId);
    expect(file.fileName).toBe('lab-result.txt');
    expect(file.fileType).toBe('text/plain');
    expect(file.encryptionVersion).toBe(1);
    expect(Buffer.from(file.encryptionIv, 'base64')).toHaveLength(12);
    expect(storedCiphertext).toBeDefined();
    expect(storedCiphertext.equals(original)).toBe(false);

    const viewed = await invokeRoute(getFileViewUrl, viewRequest(record._id.toString()));
    expect(viewed.statusCode).toBe(200);
    expect(viewed.bytes.equals(original)).toBe(true);
    expect(viewed.headers['content-type']).toBe('text/plain');
    expect(viewed.headers['content-disposition']).toContain('inline;');
    expect(viewed.headers['content-disposition']).toContain('lab-result.txt');
  });

  test('rejects ciphertext modified after upload', async () => {
    const original = Buffer.from('tamper test contents');
    const uploaded = await invokeRoute(uploadRecord, uploadRequest([{
      originalname: 'tamper.txt', mimetype: 'text/plain', size: original.length, buffer: original,
    }]));
    const file = uploaded.body.data.files[0];
    const storedCiphertext = ciphertextObjects.get(file.cloudinaryPublicId);
    storedCiphertext[0] ^= 0xff;

    const viewed = await invokeRoute(getFileViewUrl, viewRequest(uploaded.body.data._id.toString()));
    expect(viewed.statusCode).toBe(422);
    expect(viewed.body.message).toMatch(/integrity/i);
    expect(viewed.bytes).toBeUndefined();
  });

  test('denies file access to a different patient', async () => {
    const differentPatient = new mongoose.Types.ObjectId();
    const recordId = new mongoose.Types.ObjectId();
    records.set(recordId.toString(), {
      _id: recordId,
      patient: new mongoose.Types.ObjectId(),
      files: [],
      sharedWith: [],
      canUserAccess: async () => false,
    });

    const denied = await invokeRoute(getFileViewUrl, viewRequest(recordId.toString(), {
      user: { userId: differentPatient.toString(), role: 'patient' },
    }));
    expect(denied.statusCode).toBe(403);
    expect(axiosGet).not.toHaveBeenCalled();
  });

  test('serves legacy files without encryption metadata as plaintext even when record flag is set', async () => {
    const recordId = new mongoose.Types.ObjectId();
    const fileId = new mongoose.Types.ObjectId();
    const legacyBytes = Buffer.from('legacy plaintext attachment');
    const publicId = `legacy/${fileId}.pdf`;
    ciphertextObjects.set(publicId, legacyBytes);
    records.set(recordId.toString(), {
      _id: recordId,
      patient: patient._id,
      isEncrypted: true,
      encryptionKey: undefined,
      files: [{ _id: fileId, fileName: 'legacy.pdf', fileType: 'application/pdf', fileUrl: '', cloudinaryPublicId: publicId }],
      sharedWith: [],
      canUserAccess: async () => true,
    });

    const viewed = await invokeRoute(getFileViewUrl, viewRequest(recordId.toString()));
    expect(viewed.statusCode).toBe(200);
    expect(viewed.bytes.equals(legacyBytes)).toBe(true);
    expect(viewed.headers['content-type']).toBe('application/pdf');
  });

  test('deletes already uploaded ciphertext if a later file upload fails', async () => {
    const payload = Buffer.from('multi file upload');
    failUploadAt = 2;
    await expect(invokeRoute(uploadRecord, uploadRequest([
      { originalname: 'first.txt', mimetype: 'text/plain', size: payload.length, buffer: payload },
      { originalname: 'second.txt', mimetype: 'text/plain', size: payload.length, buffer: payload },
    ]))).rejects.toThrow('simulated Cloudinary upload failure');
    expect(ciphertextObjects.size).toBe(0);
    expect(deleteFile).toHaveBeenCalledTimes(1);
  });

  test('deletes uploaded ciphertext if saving the record fails', async () => {
    failRecordSave = true;
    const payload = Buffer.from('database failure cleanup');
    await expect(invokeRoute(uploadRecord, uploadRequest([{
      originalname: 'save-failure.txt', mimetype: 'text/plain', size: payload.length, buffer: payload,
    }]))).rejects.toThrow('simulated database save failure');
    expect(ciphertextObjects.size).toBe(0);
    expect(deleteFile).toHaveBeenCalledTimes(1);
  });
});
