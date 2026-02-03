import express from 'express';
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
  downloadRecordReport
} from '../controllers/recordController.js';

const router = express.Router();

// Patient routes
router.post(
  '/',
  protect,
  upload.array('files', 5),
  handleUploadErrors,
  uploadRecord
);
router.get('/my-records', protect, authorize('patient'), getMyRecords);
router.get('/stats', protect, authorize('patient'), getRecordStats);

// Doctor routes
router.get('/shared-with-me', protect, authorize('doctor'), getSharedRecords);
router.get('/patient/:patientId', protect, authorize('doctor', 'admin'), getPatientRecords);

// Shared routes
router.get('/:id/download-report', protect, downloadRecordReport);
router.get('/:id', protect, getRecordById);
router.patch('/:id', protect, updateRecord);
router.delete('/:id', protect, deleteRecord);

// Sharing routes
router.post('/:id/share', protect, authorize('patient', 'admin'), shareRecord);
router.delete('/:id/share/:doctorId', protect, authorize('patient', 'admin'), revokeAccess);

export default router;
