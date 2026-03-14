import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
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

// Cloudinary storage — files go to the 'medical-records' folder
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Images are delivered as-is; everything else as 'raw' (preserves original format)
    const isImage = file.mimetype.startsWith('image/');
    return {
      folder: 'medical-records',
      resource_type: isImage ? 'image' : 'raw',
      // Keep original filename (sanitized) so it's human-readable in Cloudinary
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
    };
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT`), false);
  }
};

// Multer instance backed by Cloudinary
export const upload = multer({
  storage,
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

/**
 * Map a multer-storage-cloudinary file object to the shape stored in MedicalRecord.files[].
 * After upload, multer populates:
 *   file.path       → secure HTTPS URL
 *   file.filename   → Cloudinary public_id
 *   file.mimetype, file.size, file.originalname
 */
export const getFileInfo = (file) => {
  return {
    fileName: file.originalname,
    fileUrl: file.path,          // Cloudinary secure URL
    cloudinaryPublicId: file.filename, // stored so we can delete later
    fileType: file.mimetype,
    fileSize: file.size,
  };
};

export default {
  upload,
  handleUploadErrors,
  deleteFile,
  getFileInfo,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
};
