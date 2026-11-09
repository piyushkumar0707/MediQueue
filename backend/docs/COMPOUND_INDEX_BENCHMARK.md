# Compound index workload benchmark

Run `npm run benchmark:indexes` from `backend/`. The script uses `mongodb://localhost:27017` by default, or `BENCHMARK_MONGODB_URI` when set. It creates a uniquely named database containing generated data and drops only that database when it finishes.

The simulated workload uses 50,000 generated documents in each of three collections (appointments, queues, notifications), 1,000 principals, 20 concurrent workers, and 2,000 measured queries per condition after warmup. Its 50/33/17 query mix is derived from the patient appointment, doctor waiting queue, and unread notification access patterns in the backend. It compares those operations without the corresponding compound indexes and with the model-aligned indexes.

## Recorded run

Local single-node MongoDB, 2026-11-09:

| Measure | No compound indexes | With compound indexes |
| --- | ---: | ---: |
| Average query latency | 79.704 ms | 5.292 ms |
| Median query latency | 77.591 ms | 4.907 ms |
| P95 query latency | 103.183 ms | 8.266 ms |
| Throughput | 242.27 req/s | 3,761.81 req/s |

Average latency reduction: `(79.704 - 5.292) / 79.704 × 100 = 93.36%` for this run.

This is a synthetic, code-derived concurrent workload on one local MongoDB instance. It does not reproduce production data distributions, traffic volume, hardware, network, or the application's full database query mix. Results can vary by machine and run. Use the measurement as evidence for a local simulated benchmark, not a production performance guarantee.

Resume wording supported by this run:

> Benchmarked compound indexes under a 20-client simulated workload across appointment, queue, and notification queries using 150k synthetic records; measured a 93% reduction in average query latency locally.

Keep the benchmark scope in the wording. Do not describe this result as production load or as an application-wide production latency reduction.
