import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

/**
 * Creates a rate limiter backed by Redis so limits are shared across
 * all processes/instances in a multi-process or clustered deployment.
 */
export const createRateLimiter = (options) =>
  rateLimit({
    ...options,
    store: new RedisStore({
      // ioredis uses .call() to dispatch arbitrary Redis commands
      sendCommand: (...args) => redisClient.call(...args),
    }),
  });
