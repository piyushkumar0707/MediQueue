# 🏥 MediQueue — Production Readiness Review

> **Verdict: NEEDS IMPROVEMENT** — Not production-ready yet, but has a strong foundation.

---

## ✅ What's Already Good

- JWT two-token pattern with httpOnly cookies
- MFA with TOTP + backup codes
- Redis integrated (OTP store, config present)
- Comprehensive audit logging with SHA-256 integrity hashes
- Input validation middleware
- Pagination caps, emergency access logic, HIPAA-relevant audit trails
- Winston structured logging
- Socket.io with server-side JWT auth

---

## 🔴 CRITICAL

### C1 — No Docker / No CI/CD Pipeline

**What:** Zero `Dockerfile`, `docker-compose.yml`, or `.github/workflows`. No CI/CD pipeline exists.

**Why it matters:** Manual deployment is error-prone and not reproducible. Any dev-to-prod inconsistency can crash the system. HIPAA environments require auditable, repeatable deployments.

**Fix:** Add `Dockerfile` for both backend and frontend, `docker-compose.yml` for local dev (with MongoDB + Redis), and a GitHub Actions workflow for lint → test → build → deploy.

---

### C2 — Zero Automated Tests

**What:** No test files anywhere — no unit, integration, or e2e tests.

**Why it matters:** This is a HIPAA-adjacent healthcare app handling medical records, prescriptions, emergency access, and consent. A single refactor can silently break critical access-control logic with no safety net.

**Fix:** Minimum coverage needed:
- Auth flows (login / MFA / token refresh)
- `canUserAccess()` logic
- Emergency access status transitions
- Consent grant / revoke
- Prescription creation

---

### C3 — `protect` Middleware Does a DB Lookup on Every Request

**What:** `auth.js` `protect()` calls `User.findById(decoded.userId)` on every authenticated request.

**Why it matters:** Under load (e.g., 100 concurrent users), this becomes 100 synchronous DB reads per second just for auth. No caching, no short-circuit.

**Fix:** Cache the user document in Redis with a short TTL (e.g., `user:{userId}` → 60 seconds). Invalidate on password change or deactivation.

---

### C4 — Analytics Endpoints Run 8+ Sequential Aggregations with No Caching

**What:** `getAnalyticsOverview` fires 8 separate `countDocuments`/`aggregate` calls sequentially against full collections. No caching.

**Why it matters:** On an admin dashboard with auto-refresh, this is a full MongoDB scan every N seconds. Will cause serious performance degradation under any real data volume.

**Fix:** Cache all analytics endpoints in Redis (TTL: 5 min). Use `Promise.all()` for the parallel calls (they already have no dependencies on each other).

---

### C5 — `express-rate-limit` Uses In-Memory Store

**What:** All rate limiters use the default in-memory store (no Redis store configured).

**Why it matters:** In-memory rate limiting is per-process. In a multi-process deployment (PM2 cluster, Kubernetes), each process has its own counter — so `max: 5` becomes `max: 5 × numProcesses`. The protection is completely ineffective.

**Fix:** Install `rate-limit-redis` and configure all limiters to use the existing Redis client as the store.

---

## 🟠 HIGH

### H1 — Missing Rate Limits on High-Risk Endpoints

**What:** No rate limits on:
- `POST /api/emergency-access/request`
- `POST /api/records` (file upload + AI)
- `POST /api/records/:id/summarize` (AI call)
- `POST /api/appointments`
- `POST /api/queue/join`

**Why it matters:** Emergency access can be spammed to probe/bypass consent. AI endpoints have direct cost implications. File upload can exhaust storage.

**Fix:** Add per-user rate limiters:
| Endpoint | Suggested Limit |
|----------|----------------|
| `POST /api/emergency-access/request` | 5 / hour |
| `POST /api/records` | 10 / hour |
| `POST /api/records/:id/summarize` | 10 / minute |
| `POST /api/appointments` | 10 / hour |
| `POST /api/queue/join` | 5 / hour |
| PDF downloads | 20 / hour |

---

### H2 — `auditLogger.js` Logs `req.user?._id` Instead of `req.user?.userId`

**What:** `auditLogger.js` line 17: `userId: req.user?._id`. The JWT decoded payload has `userId`, not `_id`. This means `userId` in audit logs created via the middleware will always be `undefined`.

**Why it matters:** Audit logs are the HIPAA compliance trail. Missing `userId` makes them useless for investigation.

**Fix:** Change to `req.user?.userId`.

---

### H3 — `errorHandler` Leaks `err.message` in Production for All Errors

**What:** `errorHandler.js` returns `message: err.message` for every error including unexpected 500s. Only the stack trace is dev-only.

**Why it matters:** Internal error messages (e.g., MongoDB error strings, path details) get sent to the client in production. Could expose schema details, query structure, or internal logic.

**Fix:** For 500 errors, return a generic `"Internal Server Error"` message in production. Only send `err.message` for intentional operational errors (4xx) where the message was explicitly set by your code.

---

### H4 — No Per-Route Body Size Limits

**What:** `express.json({ limit: '10mb' })` is set globally. No per-route smaller limit for simple JSON endpoints (login, consent grant, etc.).

**Why it matters:** A 10MB JSON payload can be sent to `/api/auth/login`, wasting CPU on parsing before validation.

**Fix:** Reduce global limit to `1mb`. Use `upload` middleware's own limit for file endpoints only.

---

### H5 — `validateEnv` Missing Critical Variables

**What:** `validateEnv.js` only validates 4 variables. `JWT_MFA_SECRET`, `REDIS_URL`, and all Twilio/email vars are not validated at startup.

**Why it matters:** App starts silently, MFA and notifications fail at runtime for the first real user.

**Fix:** Add to `required` array: `JWT_MFA_SECRET`, `REDIS_URL`. Add to `productionOnly`: `TWILIO_ACCOUNT_SID`, `EMAIL_HOST`.

---

### H6 — `addRefreshToken` in User Model Uses `validateBeforeSave: false`

**What:** `userSchema.methods.addRefreshToken` (User.js line 349) still uses `{ validateBeforeSave: false }`. This was fixed in `mfaController.js` but the model method itself was missed.

**Why it matters:** Blanket bypass of all Mongoose validators on every token save. Invalid/incomplete user data could be silently written to MongoDB.

**Fix:** Change to `{ validateModifiedOnly: true }` in `addRefreshToken`.

---

### H7 — Winston Logs to Local Filesystem

**What:** `logger.js` writes to `logs/error.log` and `logs/combined.log` on local disk.

**Why it matters:** In a containerized or horizontally-scaled deployment, logs on local filesystem are lost on container restart. No centralized log aggregation.

**Fix:** In production, use a transport like `winston-cloudwatch`, `Loggly`, or `Datadog`. Alternatively, log to stdout only and let the container platform aggregate. Remove file transports in production.

---

### H8 — `console.error` in Socket `connect_error` Handler

**What:** `Dashboard.jsx` line 127: `console.error('Socket connection error:', error)` leaks socket error details in production browser console.

**Fix:** Gate it: `if (import.meta.env.DEV) console.error(...)`.

---

## 🟡 MEDIUM

### M1 — No CORS Hardening for Multiple Origins

**What:** CORS accepts a single `FRONTEND_URL` with no validation that it's a valid URL.

**Fix:** Validate `FRONTEND_URL` format in `validateEnv`. Consider an allowlist array for staging + production.

---

### M2 — Analytics `days` Parameter Has No Upper Cap

**What:** `getUserGrowth`, `getAppointmentTrends`, `getQueuePerformance`, `getDoctorPerformance` all accept `?days=` with no upper bound. `?days=9999` would aggregate years of data.

**Fix:**
```js
const days = Math.min(parseInt(req.query.days) || 30, 365);
```

---

### M3 — Appointment Available-Slots Route Is Fully Public

**What:** `GET /api/appointments/available-slots/:doctorId` has no `protect` middleware. Anyone unauthenticated can enumerate all doctor IDs and their schedules.

**Why it matters:** Exposes doctor availability data publicly. Also a scraping vector.

**Fix:** Add `protect` middleware, or at minimum add rate limiting.

---

### M4 — No Graceful Shutdown Handling for SIGTERM

**What:** `server.js` handles `unhandledRejection` but not `SIGTERM` or `SIGINT`. In Kubernetes/Docker, `SIGTERM` is sent before force-kill.

**Why it matters:** In-flight requests are dropped hard on container stop. Database connections are not cleanly closed.

**Fix:**
```js
process.on('SIGTERM', () => {
  httpServer.close(() => {
    mongoose.connection.close();
    redisClient.quit();
    process.exit(0);
  });
});
```

---

### M5 — Winston Adds a Duplicate Console Transport in Development

**What:** `logger.js` adds a Console transport at initialization (line 23) AND adds another one if `NODE_ENV !== 'production'` (line 43). Development gets double console output for every log line.

**Fix:** Remove the first Console transport definition. Keep only the conditional one.

---

### M6 — `sanitizeBody` in auditLogger Doesn't Deep-Clone Nested Objects

**What:** `const sanitized = { ...body }` is a shallow copy. Nested objects like `{ user: { password: '...' } }` are not sanitized.

**Fix:** Use a recursive sanitize function or `JSON.parse(JSON.stringify(body))` before field deletion.

---

### M7 — Health Check Doesn't Verify DB/Redis Connectivity

**What:** `/health` returns `{ status: "healthy" }` based on uptime only. If MongoDB or Redis is down, it still returns 200.

**Why it matters:** Load balancers and Kubernetes liveness probes rely on this. A false healthy response means traffic routes to a broken instance.

**Fix:** Check `mongoose.connection.readyState === 1` and `redisClient.ping()`. Return 503 if either fails.

---

### M8 — No Helmet CSP Configuration

**What:** `helmet()` is used with defaults, which sets a very permissive Content Security Policy.

**Fix:** Configure `helmet.contentSecurityPolicy()` with explicit directives matching your frontend's needs (script sources, connect sources for the API URL).

---

### M9 — `repomix-output.xml` Committed to the Repository

**What:** `repomix-output.xml` (42K lines — entire codebase dump) is committed to the repo.

**Why it matters:** Contains all source code and structure in a single indexed file. Also creates unnecessary git history bloat.

**Fix:** Add `repomix-output.xml` to `.gitignore` and remove from git history with `git rm --cached`.

---

## 🟢 LOW

### L1 — No API Versioning

**What:** All routes are at `/api/...` with no version prefix.

**Fix:** Add `/api/v1/` prefix now while the API surface is still small.

---

### L2 — Morgan Logs All Requests Including Health Check Pings

**What:** Every `/health` ping (from load balancer, every ~5s) creates a log line.

**Fix:**
```js
morgan('combined', { skip: (req) => req.url === '/health' })
```

---

### L3 — `specialty` vs `specialization` Field Name Inconsistency

**What:** User schema has `professionalInfo.specialty` but `analytics.controller.js` references `professionalInfo.specialization`. These don't match — specialization is always `undefined` in doctor performance reports.

**Fix:** Pick one name and use it consistently throughout schema, controllers, and frontend.

---

### L4 — No `uncaughtException` Handler

**What:** Only `unhandledRejection` is handled. A synchronous throw outside async context will crash the process without logging.

**Fix:**
```js
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});
```

---

### L5 — Frontend Build Has No Env Var Validation

**What:** No validation that required Vite env vars (`VITE_API_URL`, `VITE_SOCKET_URL`) are set before `npm run build`.

**Fix:** Add a `prebuild` script in `frontend/package.json` that checks for required variables.

---

## 🏆 Top 5 Highest-Impact Fixes to Reach Production Level

| Priority | Fix | Impact |
|----------|-----|--------|
| **1** | Add Docker + CI/CD (Dockerfile, docker-compose, GitHub Actions) | Deployment reliability, reproducibility |
| **2** | Switch rate limiters to Redis store (`rate-limit-redis`) | Makes auth protection actually work in multi-process/cluster |
| **3** | Cache analytics + user lookup in Redis | Prevents DB overload under real traffic |
| **4** | Write integration tests for auth, consent, emergency access | Prevents silent regressions in critical HIPAA flows |
| **5** | Fix health check to verify DB+Redis, add SIGTERM handler | Ensures proper Kubernetes/Docker lifecycle management |

---

*Review date: 2026-03-17*
