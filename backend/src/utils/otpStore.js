import redisClient from '../config/redis.js';

const OTP_PREFIX = 'otp:';

/**
 * Store OTP data in Redis with a TTL (auto-expires).
 * @param {string} sessionId
 * @param {object} data - { otp, phoneNumber?, email?, userId?, countryCode? }
 * @param {number} ttlSeconds - time-to-live in seconds
 */
export const setOTP = async (sessionId, data, ttlSeconds) => {
  const key = `${OTP_PREFIX}${sessionId}`;
  await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
};

/**
 * Retrieve OTP data. Returns null if key doesn't exist or has expired.
 * @param {string} sessionId
 * @returns {object|null}
 */
export const getOTP = async (sessionId) => {
  const key = `${OTP_PREFIX}${sessionId}`;
  const raw = await redisClient.get(key);
  return raw ? JSON.parse(raw) : null;
};

/**
 * Delete OTP data (called after successful verification or expiry handling).
 * @param {string} sessionId
 */
export const deleteOTP = async (sessionId) => {
  const key = `${OTP_PREFIX}${sessionId}`;
  await redisClient.del(key);
};
