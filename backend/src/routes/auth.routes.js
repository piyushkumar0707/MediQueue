import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  verifyOTP,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
} from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    validate,
  ],
  register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('emailOrPhone').trim().notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate,
  ],
  login
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for MFA
// @access  Public
router.post(
  '/verify-otp',
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP is required'),
    validate,
  ],
  verifyOTP
);

// @route   POST /api/auth/forgot-password
// @desc    Request password reset
// @access  Public
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required'), validate],
  forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    validate,
  ],
  resetPassword
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', logout);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post('/refresh-token', refreshToken);

export default router;
