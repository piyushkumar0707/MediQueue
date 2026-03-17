import express from 'express';
import rateLimit from 'express-rate-limit';
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

// Per-user rate limit for emergency access requests: 5 per hour
const emergencyRequestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { success: false, message: 'Too many emergency access requests. Please wait before trying again.' },
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
