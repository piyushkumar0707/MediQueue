import { body } from 'express-validator';

// Auth validators
export const validateInitiateRegistration = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\d{7,15}$/).withMessage('Phone number must be 7-15 digits'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('countryCode')
    .optional()
    .trim()
    .matches(/^\+\d{1,4}$/).withMessage('Country code must be in format +XX'),
];

export const validateCompleteRegistration = [
  body('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 8 }).withMessage('OTP must be 4-8 characters'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['patient', 'doctor']).withMessage('Role must be patient or doctor'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('personalInfo.firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name too long'),
  body('personalInfo.lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name too long'),
];

export const validateLogin = [
  body('phoneOrEmail')
    .trim()
    .notEmpty().withMessage('Phone number or email is required'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const validateVerifyOtp = [
  body('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 4, max: 8 }).withMessage('OTP must be 4-8 characters'),
];

export const validateForgotPassword = [
  body('phoneNumber')
    .trim()
    .notEmpty().withMessage('Phone number is required'),
];

export const validateResetPassword = [
  body('sessionId')
    .trim()
    .notEmpty().withMessage('Session ID is required'),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// Consent validators
export const validateGrantConsent = [
  body('doctorId')
    .trim()
    .notEmpty().withMessage('Doctor ID is required')
    .isMongoId().withMessage('Invalid doctor ID format'),
  body('recordId')
    .trim()
    .notEmpty().withMessage('Record ID is required')
    .isMongoId().withMessage('Invalid record ID format'),
  body('permissions')
    .optional()
    .isArray().withMessage('Permissions must be an array'),
  body('expiresAt')
    .optional()
    .isISO8601().withMessage('Expiry date must be a valid ISO date'),
];

// Emergency access validators
export const validateEmergencyAccess = [
  body('patientId')
    .trim()
    .notEmpty().withMessage('Patient ID is required')
    .isMongoId().withMessage('Invalid patient ID format'),
  body('reason')
    .trim()
    .notEmpty().withMessage('Reason is required')
    .isLength({ min: 10, max: 500 }).withMessage('Reason must be 10-500 characters'),
];

// MFA validators
export const validateMfaToken = [
  body('token')
    .trim()
    .notEmpty().withMessage('MFA token is required')
    .isLength({ min: 6, max: 8 }).withMessage('Token must be 6-8 characters'),
];

export const validateMfaValidate = [
  body('mfaSessionToken')
    .trim()
    .notEmpty().withMessage('MFA session token is required'),
  body('token')
    .trim()
    .notEmpty().withMessage('MFA token is required')
    .isLength({ min: 6, max: 8 }).withMessage('Token must be 6-8 characters'),
];
