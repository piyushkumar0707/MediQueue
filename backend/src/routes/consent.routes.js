import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateGrantConsent } from '../middleware/validators.js';
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

// All routes require authentication
router.use(protect);

// Patient routes
router.get('/my-consents', authorize('patient'), getMyConsents);
router.post('/grant', authorize('patient'), validateGrantConsent, validate, grantConsent);
router.delete('/:id', authorize('patient'), revokeConsent);
router.patch('/:id', authorize('patient'), updateConsent);
router.get('/stats', authorize('patient'), getConsentStats);

// Doctor routes
router.get('/for-my-patients', authorize('doctor'), getDoctorConsents);
router.get('/check/:patientId/:recordId', authorize('doctor'), checkConsent);

// Shared routes (patient, doctor, admin)
router.get('/:id/history', getConsentHistory);

export default router;
