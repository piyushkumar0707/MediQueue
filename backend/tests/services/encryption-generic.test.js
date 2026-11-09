import { describe, expect, test } from '@jest/globals';
import { decrypt, encrypt, generateEncryptionKey } from '../../src/services/encryption.service.js';

describe('generic AES-256-GCM encryption helpers', () => {
  test('encrypt and decrypt round-trip JSON values', () => {
    const key = generateEncryptionKey();
    const original = { recordId: 'test-record', diagnosis: 'example value' };
    const encrypted = encrypt(original, key);

    expect(Buffer.from(encrypted.iv, 'base64')).toHaveLength(16);
    expect(decrypt(encrypted.encrypted, encrypted.iv, encrypted.authTag, key, true)).toEqual(original);
  });
});
