import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDoctors,
  getDoctorById,
  getProfile,
  updateProfile,
  getPatientById
} from '../controllers/userController.js';

const router = express.Router();

// Public/Protected routes
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);

// Doctor routes
router.get('/patients/:id', protect, authorize('doctor'), getPatientById);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
