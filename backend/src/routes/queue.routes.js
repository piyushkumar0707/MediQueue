import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  joinQueue,
  getMyQueueStatus,
  getMyQueueHistory,
  getDoctorQueue,
  callNextPatient,
  updateQueueStatus,
  cancelQueueEntry,
  getQueueStats
} from '../controllers/queueController.js';

const router = express.Router();

// Patient routes
router.post('/join', protect, authorize('patient'), joinQueue);
router.get('/my-status', protect, authorize('patient'), getMyQueueStatus);
router.get('/my-history', protect, authorize('patient'), getMyQueueHistory);

// Doctor routes
router.get('/doctor-queue', protect, authorize('doctor'), getDoctorQueue);
router.post('/call-next', protect, authorize('doctor'), callNextPatient);
router.get('/stats', protect, authorize('doctor'), getQueueStats);

// Shared routes
router.patch('/:id/status', protect, authorize('doctor'), updateQueueStatus);
router.delete('/:id', protect, cancelQueueEntry);

export default router;
