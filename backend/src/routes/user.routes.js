import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDoctors,
  getDoctorById,
  getProfile,
  updateProfile,
  changePassword,
  getPatientById
} from '../controllers/userController.js';

const router = express.Router();

// Protected routes (must come before dynamic :id routes)
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Public/Protected routes
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);

// Doctor routes - Get patient/user by ID (dynamic routes come last)
router.get('/patients/:id', protect, authorize('doctor'), getPatientById);
router.get('/:id', protect, getPatientById); // General user lookup

export default router;
