import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateGrantConsent } from '../middleware/validators.js';
import { createRateLimiter } from '../utils/rateLimiter.js';
import {
  getMyConsents,
  getDoctorConsents,
  grantConsent,
  revokeConsent,
  updateConsent,
  getConsentHistory,
  checkConsent,
  getConsentStats
} from '../controllers/consentController.js';

const router = express.Router();

const consentMutationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many consent updates, please try again later.' }
});

// All routes require authentication
router.use(protect);

// Patient routes
router.get('/my-consents', authorize('patient'), getMyConsents);
router.post('/grant', authorize('patient'), consentMutationRateLimit, validateGrantConsent, validate, grantConsent);
router.delete('/:id', authorize('patient'), consentMutationRateLimit, revokeConsent);
router.patch('/:id', authorize('patient'), consentMutationRateLimit, updateConsent);
router.get('/stats', authorize('patient'), getConsentStats);

// Doctor routes
router.get('/for-my-patients', authorize('doctor'), getDoctorConsents);
router.get('/check/:patientId/:recordId', authorize('doctor'), checkConsent);

// Shared routes (patient, doctor, admin)
router.get('/:id/history', getConsentHistory);

export default router;
