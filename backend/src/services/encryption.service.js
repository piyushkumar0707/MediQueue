import crypto from 'crypto';
import { logger } from '../utils/logger.js';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16;

/**
 * Generate a secure encryption key
 * @returns {string} Base64 encoded key
 */
export const generateEncryptionKey = () => {
  const key = crypto.randomBytes(KEY_LENGTH);
  return key.toString('base64');
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string|object} data - Data to encrypt
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {object} Encrypted data with IV and auth tag
 */
export const encrypt = (data, keyBase64) => {
  try {
    // Convert data to string if it's an object
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
    
    // Decode the key from base64
    const key = Buffer.from(keyBase64, 'base64');
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} ivBase64 - Base64 encoded IV
 * @param {string} authTagBase64 - Base64 encoded auth tag
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @param {boolean} parseJSON - Whether to parse result as JSON
 * @returns {string|object} Decrypted data
 */
export const decrypt = (encryptedData, ivBase64, authTagBase64, keyBase64, parseJSON = false) => {
  try {
    // Decode from base64
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse JSON if needed
    return parseJSON ? JSON.parse(decrypted) : decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash sensitive data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} Hashed data
 */
export const hash = (data) => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
};

/**
 * Encrypt file buffer
 * @param {Buffer} fileBuffer - File buffer to encrypt
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {object} Encrypted file data with metadata
 */
export const encryptFile = (fileBuffer, keyBase64) => {
  try {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64')
    };
  } catch (error) {
    logger.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
};

/**
 * Decrypt file buffer
 * @param {Buffer} encryptedBuffer - Encrypted file buffer
 * @param {string} ivBase64 - Base64 encoded IV
 * @param {string} authTagBase64 - Base64 encoded auth tag
 * @param {string} keyBase64 - Base64 encoded encryption key
 * @returns {Buffer} Decrypted file buffer
 */
export const decryptFile = (encryptedBuffer, ivBase64, authTagBase64, keyBase64) => {
  try {
    const key = Buffer.from(keyBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    logger.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
};

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} Hex encoded token
 */
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export default {
  generateEncryptionKey,
  encrypt,
  decrypt,
  hash,
  encryptFile,
  decryptFile,
  generateToken
};
