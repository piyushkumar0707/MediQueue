import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

/**
 * Creates a rate limiter backed by Redis so limits are shared across
 * all processes/instances in a multi-process or clustered deployment.
 *
 * In NODE_ENV=test the default in-memory store is used instead so that
 * clearRedis() calls from the test runner don't race with the server's
 * rate-limit counters and cause flaky test results.
 */
export const createRateLimiter = (options) => {
  const store =
    process.env.NODE_ENV === 'test'
      ? undefined // use express-rate-limit's default MemoryStore
      : new RedisStore({
          // ioredis uses .call() to dispatch arbitrary Redis commands
          sendCommand: (...args) => redisClient.call(...args),
        });

  return rateLimit({ ...options, store });
};

