import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  createPrescription,
  getPrescription,
  getMyPrescriptions,
  getDoctorPrescriptions,
  getPatientPrescriptionHistory,
  updatePrescription,
  deletePrescription,
  getPrescriptionStats
} from '../controllers/prescriptionController.js';

const router = express.Router();

// Doctor routes
router.post('/', protect, authorize('doctor'), createPrescription);
router.get('/doctor-prescriptions', protect, authorize('doctor'), getDoctorPrescriptions);
router.get('/patient/:patientId/history', protect, authorize('doctor'), getPatientPrescriptionHistory);
router.get('/patient/:patientId', protect, authorize('doctor'), getPatientPrescriptionHistory);
router.get('/stats', protect, authorize('doctor'), getPrescriptionStats);

// Patient routes
router.get('/my-prescriptions', protect, authorize('patient'), getMyPrescriptions);

// Shared routes
router.get('/:id', protect, getPrescription);
router.patch('/:id', protect, authorize('doctor'), updatePrescription);
router.delete('/:id', protect, authorize('doctor', 'admin'), deletePrescription);

export default router;
