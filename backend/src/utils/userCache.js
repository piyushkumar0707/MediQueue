import redisClient from '../config/redis.js';
import User from '../models/User.js';
import { logger } from './logger.js';

const USER_CACHE_PREFIX = 'user_auth:';
const USER_CACHE_TTL = 60; // seconds

/**
 * Get a user document from Redis cache, falling back to MongoDB on miss.
 * Returns a plain object with a `changedPasswordAfter` method re-attached
 * so auth.js middleware can call it without modification.
 * @param {string} userId
 * @returns {object|null}
 */
export const getCachedUser = async (userId) => {
  const key = `${USER_CACHE_PREFIX}${userId}`;

  try {
    const cached = await redisClient.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Re-hydrate passwordChangedAt as a Date (JSON serializes it as string)
      if (parsed.passwordChangedAt) {
        parsed.passwordChangedAt = new Date(parsed.passwordChangedAt);
      }
      // Re-attach the Mongoose method that protect() calls
      parsed.changedPasswordAfter = function (JWTTimestamp) {
        if (this.passwordChangedAt) {
          const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
          return JWTTimestamp < changedTimestamp;
        }
        return false;
      };
      return parsed;
    }
  } catch (err) {
    // Redis unavailable — fall through to DB
    logger.warn(`User cache read failed for ${userId}: ${err.message}`);
  }

  // Cache miss — fetch from DB
  const user = await User.findById(userId).select('-password -mfaSecret');
  if (!user) return null;

  try {
    await redisClient.set(key, JSON.stringify(user.toObject()), 'EX', USER_CACHE_TTL);
  } catch (err) {
    logger.warn(`User cache write failed for ${userId}: ${err.message}`);
  }

  return user;
};

/**
 * Invalidate a user's auth cache entry.
 * Call this after password change or account status change.
 * @param {string} userId
 */
export const invalidateUserCache = async (userId) => {
  const key = `${USER_CACHE_PREFIX}${userId}`;
  try {
    await redisClient.del(key);
  } catch (err) {
    logger.warn(`User cache invalidation failed for ${userId}: ${err.message}`);
  }
};
