import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyOtpOnly } from '../controllers/verifyOtpController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register/initiate', authController.initiateRegistration);
router.post('/verify-otp', verifyOtpOnly);
router.post('/register/complete', authController.completeRegistration);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

export default router;
