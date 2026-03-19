import { applyTestEnv } from './helpers/env.js';
import { clearDatabase, closeDatabaseConnection } from './helpers/database.js';
import { clearRedis, closeRedisConnection } from './helpers/redis.js';
import { jest } from '@jest/globals';

applyTestEnv();

jest.setTimeout(30000);

afterEach(async () => {
	await clearDatabase();
	await clearRedis();
});

afterAll(async () => {
	await closeDatabaseConnection();
	await closeRedisConnection();
});
