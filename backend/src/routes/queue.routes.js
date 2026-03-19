import express from 'express';
import { createRateLimiter } from '../utils/rateLimiter.js';
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
const triageRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve used the priority suggestion feature 5 times in the last minute. Please wait a moment before trying again, or select a priority manually.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI triage route
router.post('/triage', protect, authorize('patient'), triageRateLimit, triageSymptoms);

// Per-user rate limit for queue joins: 5 per hour
const joinQueueRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve joined 5 queues in the past hour. If you need immediate assistance, please contact the hospital reception directly.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Patient routes
router.post('/join', protect, authorize('patient'), joinQueueRateLimit, joinQueue);
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

