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
    'JWT_MFA_SECRET',
    'ENCRYPTION_KEY',
    'REDIS_URL',
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

  // Validate FRONTEND_URL format when set (supports comma-separated for multi-env)
  if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map(u => u.trim()).filter(Boolean);
    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        const msg = `[ENV] FRONTEND_URL contains invalid URL: "${url}"`;
        if (process.env.NODE_ENV === 'production') throw new Error(msg);
        else logger.warn(msg);
      }
    }
  }

  // AI features — optional; warn so the developer knows AI is disabled
  if (!process.env.GROQ_API_KEY) {
    logger.warn('[ENV] GROQ_API_KEY not set — AI triage and summarization features will be disabled');
  }

  // Validate ENCRYPTION_KEY length (must be exactly 32 chars for AES-256)
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    const msg = `ENCRYPTION_KEY must be exactly 32 characters (current: ${process.env.ENCRYPTION_KEY.length})`;
    if (process.env.NODE_ENV === 'production') {
      throw new Error(msg);
    } else {
      logger.warn(`[ENV] ${msg}`);
    }
  }
};
