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
  body('phoneOrEmail')
    .trim()
    .notEmpty().withMessage('Phone number or email is required')
    .custom((value) => {
      const isEmail = /^\S+@\S+\.\S+$/.test(value);
      const isPhone = /^\d{7,15}$/.test(value);
      if (!isEmail && !isPhone) {
        throw new Error('Please provide a valid email or phone number (7-15 digits)');
      }
      return true;
    }),
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
  body('scope')
    .optional()
    .isIn(['all-records', 'specific-records', 'record-types']).withMessage('Invalid consent scope'),
  body('specificRecords')
    .optional()
    .isArray().withMessage('specificRecords must be an array')
    .custom((records, { req }) => {
      if (req.body.scope === 'specific-records') {
        if (!Array.isArray(records) || records.length === 0) {
          throw new Error('specificRecords is required when scope is specific-records');
        }
        const allMongoIds = records.every((id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id));
        if (!allMongoIds) {
          throw new Error('All specificRecords entries must be valid record IDs');
        }
      }
      return true;
    }),
  body('recordTypes')
    .optional()
    .isArray().withMessage('recordTypes must be an array')
    .custom((recordTypes, { req }) => {
      const allowedRecordTypes = [
        'lab-report',
        'prescription',
        'radiology',
        'consultation-notes',
        'discharge-summary',
        'medical-history',
        'insurance',
        'vaccination',
        'allergy-info',
        'other'
      ];

      if (req.body.scope === 'record-types') {
        if (!Array.isArray(recordTypes) || recordTypes.length === 0) {
          throw new Error('recordTypes is required when scope is record-types');
        }
      }

      if (Array.isArray(recordTypes)) {
        const allValid = recordTypes.every((type) => allowedRecordTypes.includes(type));
        if (!allValid) {
          throw new Error('recordTypes contains invalid values');
        }
      }
      return true;
    }),
  body('permissions')
    .optional()
    .isObject().withMessage('Permissions must be an object')
    .custom((permissions) => {
      const keys = ['canView', 'canDownload', 'canShare'];
      for (const key of keys) {
        if (permissions[key] !== undefined && typeof permissions[key] !== 'boolean') {
          throw new Error(`permissions.${key} must be a boolean`);
        }
      }
      return true;
    }),
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
  body('emergencyType')
    .trim()
    .notEmpty().withMessage('Emergency type is required'),
  body('justification')
    .trim()
    .notEmpty().withMessage('Justification is required')
    .isLength({ min: 20, max: 1000 }).withMessage('Justification must be at least 20 characters (describe the emergency in detail)'),
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
