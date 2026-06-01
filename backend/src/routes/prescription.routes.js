import express from 'express';
import { createRateLimiter } from '../utils/rateLimiter.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  createPrescription,
  getPrescription,
  getMyPrescriptions,
  getDoctorPrescriptions,
  getPatientPrescriptionHistory,
  updatePrescription,
  deletePrescription,
  getPrescriptionStats,
  downloadPrescription
} from '../controllers/prescriptionController.js';

const router = express.Router();

// Per-user rate limit for PDF prescription downloads: 15 per 10 minutes
const downloadPrescriptionRateLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 45,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve downloaded prescriptions too many times in a short period. Please wait 10 minutes before trying again.',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Doctor routes
router.post('/', protect, authorize('doctor'), createPrescription);
router.get('/doctor-prescriptions', protect, authorize('doctor'), getDoctorPrescriptions);
router.get('/patient/:patientId/history', protect, authorize('doctor'), getPatientPrescriptionHistory);
router.get('/patient/:patientId', protect, authorize('doctor'), getPatientPrescriptionHistory);
router.get('/stats', protect, authorize('doctor'), getPrescriptionStats);

// Patient routes
router.get('/my-prescriptions', protect, authorize('patient'), getMyPrescriptions);

// Shared routes
router.get('/:id/download', protect, downloadPrescriptionRateLimit, downloadPrescription);
router.get('/:id', protect, getPrescription);
router.patch('/:id', protect, authorize('doctor'), updatePrescription);
router.delete('/:id', protect, authorize('doctor', 'admin'), deletePrescription);

export default router;

