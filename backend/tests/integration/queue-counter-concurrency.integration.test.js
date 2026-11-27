import mongoose from 'mongoose';
import QueueCounter from '../../src/models/QueueCounter.js';
import { connectTestDatabase } from '../helpers/mongoose.js';

const runIntegration = process.env.RUN_BACKEND_INTEGRATION_TESTS === 'true';
const describeIntegration = runIntegration ? describe : describe.skip;

describeIntegration('queue counter concurrency', () => {
  beforeAll(async () => {
    await connectTestDatabase();
    // The unique { doctorId, date } index must exist before concurrent upserts start
    await QueueCounter.init();
  });

  test('1000 concurrent requests get unique, sequential queue numbers', async () => {
    const requestCount = 1000;
    const doctorId = new mongoose.Types.ObjectId();
    const date = new Date('2026-01-15T12:00:00.000Z');

    const numbers = await Promise.all(
      Array.from({ length: requestCount }, () => QueueCounter.getNextQueueNumber(doctorId, date)),
    );

    const expected = Array.from({ length: requestCount }, (_, index) => index + 1);
    expect([...numbers].sort((a, b) => a - b)).toEqual(expected);
    expect(await QueueCounter.countDocuments({ doctorId })).toBe(1);
  });
});
