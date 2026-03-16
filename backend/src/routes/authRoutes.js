import express from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { verifyOtpOnly } from '../controllers/verifyOtpController.js';
import { setupMfa, verifyMfaSetup, validateMfa, disableMfa } from '../controllers/mfaController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  validateInitiateRegistration,
  validateCompleteRegistration,
  validateLogin,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
  validateMfaToken,
  validateMfaValidate,
} from '../middleware/validators.js';

const router = express.Router();

// Brute-force sensitive: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// General auth limiter: 10 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Refresh token limiter: generous — triggered on every page load
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many token refresh requests, please try again later.' },
});

// Strict OTP limiter: 5 requests per 15 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests, please try again later.' },
});

// Public routes
router.post('/register/initiate', otpLimiter, validateInitiateRegistration, validate, authController.initiateRegistration);
router.post('/verify-otp', otpLimiter, validateVerifyOtp, validate, verifyOtpOnly);
router.post('/register/complete', authLimiter, validateCompleteRegistration, validate, authController.completeRegistration);
router.get('/verify-email', authController.verifyEmail);
router.post('/login', loginLimiter, validateLogin, validate, authController.login);
router.post('/refresh-token', refreshLimiter, authController.refreshToken);
router.post('/forgot-password', otpLimiter, validateForgotPassword, validate, authController.forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, validate, authController.resetPassword);

// MFA code limiter: 10 attempts per 15 minutes (generous for code entry)
const mfaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many MFA attempts, please try again later.' },
});

// MFA login validation (public — user has mfaSessionToken but no full auth yet)
router.post('/mfa/validate', mfaLimiter, validateMfaValidate, validate, validateMfa);

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

// MFA management (protected — setup/disable require logged-in user)
router.post('/mfa/setup', setupMfa);
router.post('/mfa/verify-setup', validateMfaToken, validate, verifyMfaSetup);
router.post('/mfa/disable', validateMfaToken, validate, disableMfa);

export default router;
