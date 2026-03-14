import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, authorize } from '../middleware/auth.js';
import {
  joinQueue,
  getMyQueueStatus,
  getMyQueueHistory,
  getDoctorQueue,
  callNextPatient,
  updateQueueStatus,
  cancelQueueEntry,
  getQueueStats,
  triageSymptoms
} from '../controllers/queueController.js';

const router = express.Router();

// Per-user rate limit for AI triage: 5 requests/minute
const triageRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { success: false, message: 'Too many triage requests. Please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI triage route
router.post('/triage', protect, authorize('patient'), triageRateLimit, triageSymptoms);

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
