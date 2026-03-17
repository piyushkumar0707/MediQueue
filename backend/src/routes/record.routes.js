import express from 'express';
import { createRateLimiter } from '../utils/rateLimiter.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload, handleUploadErrors } from '../middleware/upload.js';
import {
  uploadRecord,
  getMyRecords,
  getPatientRecords,
  getSharedRecords,
  getRecordById,
  shareRecord,
  revokeAccess,
  updateRecord,
  deleteRecord,
  getRecordStats,
  downloadRecordReport,
  summarizeRecord,
  getFileViewUrl
} from '../controllers/recordController.js';

const router = express.Router();

// Per-user rate limit for file uploads: 10 per hour
const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { success: false, message: 'Too many file uploads. Please wait before uploading again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user rate limit for AI summarization: 10 per minute
const summarizeRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { success: false, message: 'Too many summarization requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user rate limit for PDF report downloads: 20 per hour
const downloadReportRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { success: false, message: 'Too many download requests. Please wait before downloading again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Patient routes
router.post(
  '/',
  protect,
  uploadRateLimit,
  upload.array('files', 5),
  handleUploadErrors,
  uploadRecord
);
router.get('/my-records', protect, authorize('patient'), getMyRecords);
router.get('/stats', protect, authorize('patient'), getRecordStats);

// Doctor routes
router.get('/shared-with-me', protect, authorize('doctor'), getSharedRecords);
router.get('/patient/:patientId', protect, authorize('doctor', 'admin'), getPatientRecords);

// AI routes
router.post('/:id/summarize', protect, summarizeRateLimit, summarizeRecord);
router.get('/:id/view-file', protect, getFileViewUrl);

// Shared routes
router.get('/:id/download-report', protect, downloadReportRateLimit, downloadRecordReport);
router.get('/:id', protect, getRecordById);
router.patch('/:id', protect, updateRecord);
router.delete('/:id', protect, deleteRecord);

// Sharing routes
router.post('/:id/share', protect, authorize('patient', 'admin'), shareRecord);
router.delete('/:id/share/:doctorId', protect, authorize('patient', 'admin'), revokeAccess);

export default router;

