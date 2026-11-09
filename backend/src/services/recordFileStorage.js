import axios from 'axios';
import cloudinary from '../config/cloudinary.js';
import { buildRecordFileAAD, decryptFile, unwrapKey } from './encryption.service.js';

const DIRECT_FILE_HOST_ALLOWLIST = new Set(['www.w3.org', 'res.cloudinary.com']);

export class EncryptedFileIntegrityError extends Error {
  constructor() {
    super('Encrypted file integrity check failed');
    this.name = 'EncryptedFileIntegrityError';
  }
}

const isAllowlistedDirectFileUrl = (value = '') => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && DIRECT_FILE_HOST_ALLOWLIST.has(parsed.hostname);
  } catch {
    return false;
  }
};

const getPublicIdFromUrl = (value = '') => {
  if (!isAllowlistedDirectFileUrl(value)) return null;
  const match = value.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match?.[1] || null;
};

const getSignedDownloadUrl = (publicId, file) => cloudinary.utils.private_download_url(publicId, null, {
  resource_type: file.encryptionVersion === 1
    ? 'raw'
    : (file.fileType || '').startsWith('image/') ? 'image' : 'raw',
  type: 'upload',
  expires_at: Math.floor(Date.now() / 1000) + 300,
});

const fetchBuffer = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(response.data);
};

/** Fetch a stored attachment and decrypt versioned ciphertext; metadata-free legacy files remain plaintext. */
export const fetchRecordFileBytes = async (record, file) => {
  const publicId = file.cloudinaryPublicId || getPublicIdFromUrl(file.fileUrl);
  let storedBytes;

  if (publicId) {
    try {
      storedBytes = await fetchBuffer(getSignedDownloadUrl(publicId, file));
    } catch (error) {
      if (file.encryptionVersion == null && isAllowlistedDirectFileUrl(file.fileUrl)) {
        storedBytes = await fetchBuffer(file.fileUrl);
      } else {
        throw error;
      }
    }
  } else if (file.encryptionVersion == null && isAllowlistedDirectFileUrl(file.fileUrl)) {
    storedBytes = await fetchBuffer(file.fileUrl);
  } else {
    throw new Error('Stored record file is unavailable');
  }

  if (file.encryptionVersion == null) return storedBytes;
  if (file.encryptionVersion !== 1 || !file.encryptionIv || !file.encryptionAuthTag || !record.encryptionKey || !file._id) {
    throw new EncryptedFileIntegrityError();
  }

  try {
    const recordKey = unwrapKey(record.encryptionKey);
    const aad = buildRecordFileAAD(record._id, file._id);
    return decryptFile(storedBytes, file.encryptionIv, file.encryptionAuthTag, recordKey, aad);
  } catch {
    throw new EncryptedFileIntegrityError();
  }
};

export default { fetchRecordFileBytes, EncryptedFileIntegrityError };
