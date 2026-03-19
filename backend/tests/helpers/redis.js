import redisClient from '../../src/config/redis.js';

export const clearRedis = async () => {
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }

    if (redisClient.status === 'ready') {
      await redisClient.flushdb();
    }
  } catch {
    // Intentionally ignore Redis cleanup failures in tests that do not require Redis state.
  }
};

export const closeRedisConnection = async () => {
  try {
    if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
      await redisClient.quit();
    }
  } catch {
    // Ignore Redis shutdown failures to avoid masking test assertions.
  }
};
