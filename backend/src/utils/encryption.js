const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // Should be stored securely
const IV_LENGTH = 16; // AES block size

/**
 * Generate a random initialization vector
 */
const generateIV = () => {
  return crypto.randomBytes(IV_LENGTH);
};

/**
 * Encrypt a buffer
 * @param {Buffer} buffer - Data to encrypt
 * @returns {Object} - { encryptedData: Buffer, iv: string }
 */
const encryptBuffer = (buffer) => {
  const iv = generateIV();
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex')
  };
};

/**
 * Decrypt a buffer
 * @param {Buffer} encryptedBuffer - Encrypted data
 * @param {string} ivHex - Initialization vector in hex format
 * @returns {Buffer} - Decrypted data
 */
const decryptBuffer = (encryptedBuffer, ivHex) => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  
  return decrypted;
};

/**
 * Encrypt a file
 * @param {string} inputPath - Path to file to encrypt
 * @param {string} outputPath - Path where encrypted file will be saved
 * @returns {Promise<string>} - IV in hex format
 */
const encryptFile = async (inputPath, outputPath) => {
  try {
    const data = await fs.readFile(inputPath);
    const { encryptedData, iv } = encryptBuffer(data);
    
    await fs.writeFile(outputPath, encryptedData);
    
    return iv;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt a file
 * @param {string} inputPath - Path to encrypted file
 * @param {string} outputPath - Path where decrypted file will be saved
 * @param {string} ivHex - Initialization vector in hex format
 * @returns {Promise<void>}
 */
const decryptFile = async (inputPath, outputPath, ivHex) => {
  try {
    const encryptedData = await fs.readFile(inputPath);
    const decryptedData = decryptBuffer(encryptedData, ivHex);
    
    await fs.writeFile(outputPath, decryptedData);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Encrypt file in place (replaces original)
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} - IV in hex format
 */
const encryptFileInPlace = async (filePath) => {
  try {
    const data = await fs.readFile(filePath);
    const { encryptedData, iv } = encryptBuffer(data);
    
    await fs.writeFile(filePath, encryptedData);
    
    return iv;
  } catch (error) {
    throw new Error(`In-place encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt file and return as buffer (for streaming)
 * @param {string} filePath - Path to encrypted file
 * @param {string} ivHex - Initialization vector in hex format
 * @returns {Promise<Buffer>} - Decrypted data buffer
 */
const decryptFileToBuffer = async (filePath, ivHex) => {
  try {
    const encryptedData = await fs.readFile(filePath);
    return decryptBuffer(encryptedData, ivHex);
  } catch (error) {
    throw new Error(`Decryption to buffer failed: ${error.message}`);
  }
};

/**
 * Hash a string (for integrity checks)
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
const hashString = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a secure random filename
 * @param {string} extension - File extension
 * @returns {string} - Random filename
 */
const generateSecureFilename = (extension) => {
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${extension}`;
};

/**
 * Validate encryption key
 * @returns {boolean} - Whether key is properly configured
 */
const validateEncryptionKey = () => {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.warn('⚠️  ENCRYPTION_KEY not properly configured. Using temporary key (NOT SECURE FOR PRODUCTION)');
    return false;
  }
  return true;
};

// Validate on module load
validateEncryptionKey();

module.exports = {
  encryptBuffer,
  decryptBuffer,
  encryptFile,
  decryptFile,
  encryptFileInPlace,
  decryptFileToBuffer,
  hashString,
  generateSecureFilename,
  ALGORITHM,
  IV_LENGTH
};
