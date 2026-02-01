import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
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

// All routes require authentication
router.use(protect);

// Doctor routes
router.post('/request', authorize('doctor'), requestEmergencyAccess);
router.get('/my-requests', authorize('doctor'), getMyEmergencyRequests);
router.get('/check/:patientId', authorize('doctor'), checkEmergencyAccess);

// Admin routes
router.get('/for-review', authorize('admin'), getEmergencyAccessForReview);
router.patch('/:id/review', authorize('admin'), reviewEmergencyAccess);
router.get('/stats', authorize('admin'), getEmergencyAccessStats);

// Shared routes (Admin or requesting doctor)
router.delete('/:id', revokeEmergencyAccess);

export default router;
