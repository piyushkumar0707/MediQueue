import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      logger.error('Redis: max retries reached, giving up');
      return null;
    }
    return Math.min(times * 200, 1000);
  },
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));

export default redisClient;
