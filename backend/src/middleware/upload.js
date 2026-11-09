import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

// Allowed MIME types for medical records
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// File filter function
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT`), false);
  }
};

// Bounded Multer memory storage so the controller can encrypt bytes before Cloudinary upload.
export const upload = multer({
  // Keep files in memory only long enough to encrypt them before storage.
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
});

// Middleware to handle multer / Cloudinary errors
export const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files per upload',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    // Cloudinary errors arrive as { error: { message, http_code } } objects
    const msg = err.message
      || err?.error?.message
      || (typeof err === 'string' ? err : null)
      || 'File upload failed. Please try again.';
    logger.error('Upload error:', err);
    return res.status(400).json({ success: false, message: msg });
  }
  next();
};

/**
 * Delete a file from Cloudinary by its public_id.
 * @param {string} publicId  - Cloudinary public_id stored in the DB
 * @param {string} resourceType - 'image' | 'raw' (default: 'raw')
 */
export const deleteFile = async (publicId, resourceType = 'raw') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result.result === 'ok';
  } catch (error) {
    logger.error('Error deleting file from Cloudinary:', error);
    return false;
  }
};

export const uploadEncryptedBuffer = (buffer, publicId) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream({
    folder: 'medical-records',
    public_id: publicId,
    resource_type: 'raw',
  }, (error, result) => {
    if (error) return reject(error);
    resolve(result);
  });
  uploadStream.end(buffer);
});

export default {
  upload,
  handleUploadErrors,
  deleteFile,
  uploadEncryptedBuffer,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
};
