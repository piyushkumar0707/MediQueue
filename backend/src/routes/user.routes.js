import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getDoctors,
  getDoctorById,
  getProfile,
  updateProfile
} from '../controllers/userController.js';

const router = express.Router();

// Public/Protected routes
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

export default router;
