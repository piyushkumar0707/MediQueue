import mongoose from 'mongoose';

// Safe, repeatable synthetic load test. Uses a uniquely named database and drops only it.
const uri = process.env.BENCHMARK_MONGODB_URI || 'mongodb://localhost:27017';
const dbName = `codex_workload_benchmark_${Date.now()}`;
const documentsPerCollection = Number(process.env.BENCHMARK_DOCUMENTS || 50000);
const principalCount = 1000;
const concurrency = Number(process.env.BENCHMARK_CONCURRENCY || 20);
const measuredRequestsPerWorker = Number(process.env.BENCHMARK_REQUESTS_PER_WORKER || 100);
const warmupRequestsPerWorker = 10;
const batchSize = 1000;

const principals = Array.from({ length: principalCount }, () => new mongoose.Types.ObjectId());
const rng = (seed) => () => {
  let x = seed += 0x6D2B79F5;
  x = Math.imul(x ^ x >>> 15, x | 1);
  x ^= x + Math.imul(x ^ x >>> 7, x | 61);
  return ((x ^ x >>> 14) >>> 0) / 4294967296;
};
const percentile = (values, p) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
const summarize = (values, elapsedMs) => {
  const result = {
    requests: values.length,
    averageMs: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3)),
    medianMs: Number(percentile(values, 0.5).toFixed(3)),
    p95Ms: Number(percentile(values, 0.95).toFixed(3)),
  };
  if (elapsedMs !== undefined) {
    result.elapsedSeconds = Number((elapsedMs / 1000).toFixed(2));
    result.throughputRps = Number((values.length / (elapsedMs / 1000)).toFixed(2));
  }
  return result;
};

try {
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const appointments = db.collection('appointments');
  const queues = db.collection('queues');
  const notifications = db.collection('notifications');
  const now = Date.now();

  const populate = async (collection, makeDocument) => {
    for (let offset = 0; offset < documentsPerCollection; offset += batchSize) {
      const count = Math.min(batchSize, documentsPerCollection - offset);
      await collection.insertMany(Array.from({ length: count }, (_, i) => makeDocument(offset + i)), { ordered: false });
    }
  };

  await Promise.all([
    populate(appointments, (i) => ({ patient: principals[i % principalCount], doctor: principals[(i * 17) % principalCount], status: ['scheduled', 'confirmed', 'completed', 'cancelled'][i % 4], appointmentDate: new Date(now - i * 60000) })),
    populate(queues, (i) => ({ doctor: principals[(i * 17) % principalCount], patient: principals[i % principalCount], status: ['waiting', 'in-progress', 'completed'][i % 3], checkInTime: new Date(now - i * 30000) })),
    populate(notifications, (i) => ({ recipient: principals[i % principalCount], isRead: i % 4 === 0, type: ['appointment', 'queue', 'record', 'system'][i % 4], createdAt: new Date(now - i * 15000) })),
  ]);

  const queries = {
    appointments: async (principal) => appointments.find({ patient: principal }).sort({ appointmentDate: -1 }).limit(20).toArray(),
    queues: async (principal) => queues.find({ doctor: principal, status: 'waiting' }).sort({ checkInTime: 1 }).limit(20).toArray(),
    notifications: async (principal) => notifications.find({ recipient: principal, isRead: false }).sort({ createdAt: -1 }).limit(20).toArray(),
  };
  const weights = ['appointments', 'appointments', 'appointments', 'queues', 'queues', 'notifications'];

  const runWorker = async (workerId, count, discard) => {
    const rngWorker = rng(workerId + 101);
    const timings = { appointments: [], queues: [], notifications: [] };
    for (let i = 0; i < count; i++) {
      const type = weights[Math.floor(rngWorker() * weights.length)];
      const principal = principals[Math.floor(rngWorker() * principalCount)];
      const start = process.hrtime.bigint();
      await queries[type](principal);
      const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
      if (!discard) timings[type].push(elapsed);
    }
    return timings;
  };

  const loadCondition = async () => {
    await Promise.all(Array.from({ length: concurrency }, (_, worker) => runWorker(worker, warmupRequestsPerWorker, true)));
    const start = process.hrtime.bigint();
    const results = await Promise.all(Array.from({ length: concurrency }, (_, worker) => runWorker(worker, measuredRequestsPerWorker, false)));
    const elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    const combined = { appointments: [], queues: [], notifications: [] };
    for (const result of results) {
      for (const type of Object.keys(combined)) combined[type].push(...result[type]);
    }
    const all = Object.values(combined).flat();
    return {
      overall: summarize(all, elapsed),
      byQuery: Object.fromEntries(Object.entries(combined).map(([type, values]) => [type, summarize(values)])),
    };
  };

  const withoutIndexes = await loadCondition();
  await Promise.all([
    appointments.createIndex({ patient: 1, appointmentDate: -1 }, { name: 'bench_patient_appointmentDate' }),
    queues.createIndex({ doctor: 1, status: 1, checkInTime: 1 }, { name: 'bench_doctor_status_checkInTime' }),
    notifications.createIndex({ recipient: 1, isRead: 1, createdAt: -1 }, { name: 'bench_recipient_isRead_createdAt' }),
  ]);
  const withIndexes = await loadCondition();
  const reduction = (before, after) => Number(((before - after) / before * 100).toFixed(2));

  console.log(JSON.stringify({
    database: dbName,
    dataset: { documentsPerCollection, collections: 3, totalDocuments: documentsPerCollection * 3, principals: principalCount },
    load: { concurrentWorkers: concurrency, requestsPerWorker: measuredRequestsPerWorker, warmupRequestsPerWorker, queryMix: '50% patient appointments, 33.3% waiting queue by doctor, 16.7% unread notifications' },
    indexes: [
      { collection: 'appointments', keys: { patient: 1, appointmentDate: -1 } },
      { collection: 'queues', keys: { doctor: 1, status: 1, checkInTime: 1 } },
      { collection: 'notifications', keys: { recipient: 1, isRead: 1, createdAt: -1 } },
    ],
    withoutIndexes,
    withIndexes,
    averageLatencyReductionPercent: reduction(withoutIndexes.overall.averageMs, withIndexes.overall.averageMs),
    caveat: 'Synthetic data, single local MongoDB, concurrent clients, and a code-derived query mix; not production traffic or production hardware.',
  }, null, 2));
} finally {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase().catch(() => {});
    await mongoose.disconnect();
  }
}
