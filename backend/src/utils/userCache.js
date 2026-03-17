import redisClient from '../config/redis.js';
import User from '../models/User.js';
import { logger } from './logger.js';

const USER_CACHE_PREFIX = 'user_auth:';
const USER_CACHE_TTL = 60; // seconds

/**
 * Generic cache helper — returns cached value or runs fetchFn, stores result.
 * Falls back to calling fetchFn directly if Redis is unavailable.
 * @param {string} key - Redis cache key
 * @param {number} ttlSeconds - time-to-live in seconds
 * @param {Function} fetchFn - async function that returns the data to cache
 * @returns {*} cached or freshly fetched data
 */
export const getOrSetCache = async (key, ttlSeconds, fetchFn) => {
  try {
    const cached = await redisClient.get(key);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn(`Cache read failed for key "${key}": ${err.message}`);
  }

  const data = await fetchFn();

  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn(`Cache write failed for key "${key}": ${err.message}`);
  }

  return data;
};

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
