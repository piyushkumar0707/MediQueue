import { logger } from '../utils/logger.js';

/**
 * Validates required environment variables.
 * Throws in production if critical vars are missing; warns in development.
 */
export const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
  ];

  const productionOnly = [
    'FRONTEND_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      logger.warn(`[ENV] ${msg} — using defaults for development`);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    const missingProd = productionOnly.filter(key => !process.env[key]);
    if (missingProd.length > 0) {
      throw new Error(`Missing production environment variables: ${missingProd.join(', ')}`);
    }
  } else {
    if (!process.env.FRONTEND_URL) {
      logger.warn('[ENV] FRONTEND_URL not set — defaulting to http://localhost:5173');
    }
  }
};
