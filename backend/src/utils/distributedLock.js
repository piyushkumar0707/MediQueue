import redisClient from '../config/redis.js';
import { logger } from './logger.js';

/**
 * Distributed Lock for Cron Jobs
 * Prevents duplicate execution when running multiple backend instances
 * 
 * @param {string} lockKey - Unique identifier for the lock (e.g., 'cron:24h-reminders')
 * @param {number} ttlSeconds - Lock expiration time (should be shorter than cron interval)
 * @param {Function} fn - The function to execute if lock is acquired
 * @returns {Promise<void>}
 */
export const withDistributedLock = async (lockKey, ttlSeconds, fn) => {
  const lockValue = `${process.pid}-${Date.now()}`;
  
  try {
    // Attempt to acquire lock atomically (SET NX EX)
    const acquired = await redisClient.set(lockKey, lockValue, 'NX', 'EX', ttlSeconds);

    if (!acquired) {
      logger.info(`Cron ${lockKey}: lock held by another instance, skipping execution`);
      return;
    }

    logger.info(`Cron ${lockKey}: lock acquired, executing job`);

    try {
      await fn();
      logger.info(`Cron ${lockKey}: job completed successfully`);
    } catch (error) {
      logger.error(`Cron ${lockKey}: job execution failed:`, error);
      throw error; // Re-throw to ensure caller knows about failure
    } finally {
      // Only release lock if we still own it (prevents race condition)
      const currentValue = await redisClient.get(lockKey);
      if (currentValue === lockValue) {
        await redisClient.del(lockKey);
        logger.info(`Cron ${lockKey}: lock released`);
      } else {
        logger.warn(`Cron ${lockKey}: lock was already released or taken by another instance`);
      }
    }
  } catch (error) {
    logger.error(`Cron ${lockKey}: lock acquisition error:`, error);
    // Don't re-throw - allow cron to continue on next interval
  }
};

export default withDistributedLock;
