import express from 'express';
import { createRateLimiter } from '../utils/rateLimiter.js';
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
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'Too many login attempts from this device. For your security, please wait 15 minutes before trying again. If you forgot your password, you can reset it.',
    retryAfter: '15 minutes'
  },
});

// General auth limiter: 10 requests per 15 minutes per IP
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'You\'ve made too many authentication requests. Please wait 15 minutes to continue.',
    retryAfter: '15 minutes'
  },
});

// Refresh token limiter: generous — triggered on every page load
const refreshLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'There seems to be an issue with your session. Please log out and log back in.',
    retryAfter: '15 minutes'
  },
});

// Strict OTP limiter: 5 requests per 15 minutes per IP
const otpLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'You\'ve requested too many verification codes. Please wait 15 minutes before requesting a new code.',
    retryAfter: '15 minutes'
  },
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
const mfaLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'Too many authentication code attempts. Please wait 15 minutes, then try again or use a backup code.',
    retryAfter: '15 minutes'
  },
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

