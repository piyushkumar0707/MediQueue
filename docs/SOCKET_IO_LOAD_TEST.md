# Socket.IO notification load test

## Repeatable command

Run from the backend directory:

```powershell
cd backend
npm run benchmark:socket
```

Defaults: 120 synthetic patient clients and five rounds (600 measured notifications). The harness creates a uniquely named MongoDB database, starts the backend on an available local port, starts an isolated Redis process (or a temporary Docker Redis container if `redis-server` is unavailable), and tears down the clients and temporary services. It drops only the database it created. The REST notification payload disables email and SMS and leaves in-app delivery enabled.

To use an existing MongoDB service, set `BENCHMARK_MONGODB_URI` (or `MONGODB_URI`) to its base connection URI. The harness replaces the URI database path with its unique database name. Otherwise, it uses a reachable local MongoDB or starts a temporary local `mongod` if available. `MONGOD_PATH` and `REDIS_SERVER_PATH` can point to executable paths when they are not on `PATH`. `BENCHMARK_SOCKET_CLIENTS`, `BENCHMARK_SOCKET_ROUNDS`, and `BENCHMARK_SOCKET_DELIVERY_TIMEOUT_MS` override the defaults. The optional `BENCHMARK_SOCKET_PORT` sets the backend port; by default the harness reserves an available port.

The script uses the `ws` package to speak the Engine.IO v4 / Socket.IO protocol over WebSocket only, so the harness also works with the backend's declared Node 18 minimum. A small optional acknowledgement on the existing `join` event confirms that the server joined each authenticated client to its user and role rooms before load begins.

## What is measured

For each round, the script launches one authenticated `POST /api/v1/notifications` request per client concurrently. Each request creates a `queue_update` notification addressed to that client's own user ID. The client uses a valid five-minute JWT in the Socket.IO handshake, then acknowledges the server-assigned room join. The test verifies the HTTP response and that the corresponding notification arrives on the correct client's socket.

Notification latency is measured from REST request start to socket receipt with `performance.now()` in the same Node process. Throughput uses total correctly received notifications divided by the elapsed time from the first request start to the last receipt. Connection setup timing includes WebSocket connection, JWT handshake, and acknowledged room join. Any lost or misrouted notification makes the script exit non-zero.

## Measured results

Successful default run: **2026-11-09 12:14:36 UTC**.

| Measure | Result |
| --- | ---: |
| Concurrent authenticated clients | 120 |
| Notification rounds | 5 |
| Notifications sent | 600 |
| Successful HTTP responses | 600 / 600 |
| Correct socket receipts | 600 / 600 |
| Delivery rate | 100% |
| Lost / duplicate / misrouted events | 0 / 0 / 0 |
| Request workload elapsed | 2.67563 seconds |
| Throughput | 224.25 notifications/second |
| Connection setup average | 192.67 ms |
| Connection setup P95 | 218.83 ms |
| Request-start-to-receipt median | 400.88 ms |
| Request-start-to-receipt P95 | 688.30 ms |
| Request-start-to-receipt maximum | 733.01 ms |

Throughput calculation: `600 / 2.67563 seconds = 224.25 notifications/second` (rounded to two decimals).

The latency includes REST transfer, JWT and user-cache processing, MongoDB notification persistence, and Socket.IO delivery. It is an end-to-end application-path measurement, not isolated WebSocket transport latency.

## Machine and environment notes

- Single local Windows machine (`win32 10.0.26300`), x64, 16 logical CPUs, 15.25 GiB RAM.
- Node.js v22.19.0; temporary MongoDB v8.0.13; temporary local Redis server process.
- One backend process, loopback network, temporary synthetic user accounts, and a uniquely named temporary MongoDB database.
- The database is dropped and temporary processes are stopped when the script exits, including error exits.

## Interview explanation

> “I load-tested the authenticated Socket.IO notification path with 120 synthetic clients. Each client connected over WebSocket using its own short-lived JWT and joined its server-assigned user room. Across five rounds, I concurrently sent 120 queue-update notifications per round through the notification API. All 600 requests succeeded, and each notification reached the correct client, at about 224 notifications per second. Request-start-to-receipt P95 was about 688 ms. This was a single-machine synthetic test, not a production capacity test.”

## Limitations and claim boundaries

- Single machine and one backend process; it does not model production hardware, network conditions, distributed traffic, or multi-instance deployment.
- Synthetic accounts and notifications; it does not model real user behavior or production data distributions.
- Five bursts are a short load test, not a sustained soak test.
- This exercises the notification API path (`POST /api/v1/notifications`), not the complete `callNextPatient` queue workflow.
- Queue screens continue to poll for queue position and status; this test does not establish that queue state is pushed over Socket.IO.
- Do not claim sub-200 ms notification latency or real-time queue state from these measurements.
