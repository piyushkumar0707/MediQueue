import express from 'express';
import { createRateLimiter } from '../utils/rateLimiter.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateEmergencyAccess } from '../middleware/validators.js';
import {
  requestEmergencyAccess,
  getMyEmergencyRequests,
  getEmergencyAccessForReview,
  reviewEmergencyAccess,
  revokeEmergencyAccess,
  getEmergencyAccessStats,
  checkEmergencyAccess
} from '../controllers/emergencyAccessController.js';

const router = express.Router();

// Per-user rate limit for emergency access requests: 30 per 10 minutes
const emergencyRequestRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve requested emergency access 30 times in 10 minutes. Please wait 10 minutes before requesting access again.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(protect);

// Doctor routes
router.post('/request', authorize('doctor'), emergencyRequestRateLimit, validateEmergencyAccess, validate, requestEmergencyAccess);
router.get('/my-requests', authorize('doctor'), getMyEmergencyRequests);
router.get('/check/:patientId', authorize('doctor'), checkEmergencyAccess);

// Admin routes
router.get('/for-review', authorize('admin'), getEmergencyAccessForReview);
router.patch('/:id/review', authorize('admin'), reviewEmergencyAccess);
router.get('/stats', authorize('admin'), getEmergencyAccessStats);

// Shared routes (Admin or requesting doctor)
router.delete('/:id', revokeEmergencyAccess);

export default router;

