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

// Per-user rate limit for AI triage: 5 requests per 60 minutes — Groq API cost control
const triageRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve used the AI priority suggestion 5 times this hour. Please select a priority manually or try again later.',
    retryAfter: '60 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI triage route
router.post('/triage', protect, authorize('patient'), triageRateLimit, triageSymptoms);

// Per-user rate limit for queue joins: 10 per 10 minutes — patients join once per visit
const joinQueueRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve joined too many queues in a short time. Please wait 10 minutes before joining another queue.',
    retryAfter: '10 minutes'
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

