# MediQueue — Issue Tracker & Fix Plan

> Generated from full senior SDE code review of backend + frontend source.
> Issues are ordered by severity. Each issue contains the exact file/line, root cause, fix, and broken subtasks.

---

## Severity Legend

| Badge | Meaning |
|---|---|
| 🔴 CRITICAL | Will break in production or leak sensitive data |
| 🟠 HIGH | Data integrity or security risk |
| 🟡 MEDIUM | Code quality, operational, or DX gap |
| 🔵 LOW | Polish, cleanup, or nice-to-have |

---

## Status Legend

| Badge | Meaning |
|---|---|
| `[ ]` | Not started |
| `[x]` | Done |

---

## Table of Contents

1. [🔴 Queue stats always returns empty](#issue-1--queue-stats-always-returns-empty)
2. [🔴 error.message leaks in production 500s](#issue-2--errormessage-leaks-in-production-500-responses)
3. [🔴 Queue number race condition](#issue-3--queue-number-race-condition)
4. [🟠 Encryption keys co-located with encrypted data](#issue-4--encryption-keys-co-located-with-encrypted-data)
5. [🟠 Two emergency controller files — dead code](#issue-5--two-emergency-controller-files--dead-code)
6. [🟠 N+1 queries in getDoctorQueue](#issue-6--n1-queries-in-getdoctorqueue)
7. [🟠 recharts installed in backend](#issue-7--recharts-installed-in-backend)
8. [🟠 No HTTPS enforcement](#issue-8--no-https-enforcement)
9. [🟡 Zero test files](#issue-9--zero-test-files)
10. [🟡 OTP has no attempt lockout](#issue-10--otp-has-no-attempt-lockout)
11. [🟡 No CI/CD pipeline](#issue-11--no-cicd-pipeline)
12. [🟡 No Docker setup](#issue-12--no-docker-setup)
13. [🔵 Missing indexes on core models](#issue-13--missing-indexes-on-core-models)
14. [🔵 node-cron has no distributed lock](#issue-14--node-cron-has-no-distributed-lock)

---

## ISSUE 1 — Queue stats always returns empty

**Severity**: 🔴 CRITICAL
**File**: `backend/src/controllers/queueController.js` — line 443
**Feature broken**: `GET /api/v1/queue/stats` (Doctor dashboard stats)

### Root Cause

MongoDB aggregation `$match` does **not** auto-cast strings to `ObjectId`. `req.user.userId` from the JWT payload is a string. The `doctor` field in the Queue collection stores an `ObjectId`. The types never match — the aggregation always returns `[]` silently.

```js
// ❌ Current broken code
const stats = await Queue.aggregate([
  {
    $match: {
      doctor: req.user.userId,  // string — never matches ObjectId
      checkInTime: { $gte: today }
    }
  },
  ...
]);
```

### Fix

```js
// ✅ Cast to ObjectId before aggregation
import mongoose from 'mongoose';

const stats = await Queue.aggregate([
  {
    $match: {
      doctor: new mongoose.Types.ObjectId(req.user.userId), // ← fix
      checkInTime: { $gte: today }
    }
  },
  ...
]);
```

### Subtasks

- [ ] **1.1** Open `queueController.js` → find `getQueueStats` function (~line 430)
- [ ] **1.2** Replace `doctor: req.user.userId` with `doctor: new mongoose.Types.ObjectId(req.user.userId)`
- [ ] **1.3** Verify `mongoose` is already imported at the top of the file (it is — line 1)
- [ ] **1.4** Search the entire codebase for other aggregations using `req.user.userId` directly in `$match` — audit and fix each one:
  ```bash
  grep -rn "req.user.userId" src/controllers/ | grep -i "match\|aggregate"
  ```
- [ ] **1.5** Test `GET /api/v1/queue/stats` as a doctor with active queue entries — confirm non-empty response
- [ ] **1.6** Test with an empty queue — confirm `[]` is still returned (not an error)

---

## ISSUE 2 — error.message leaks in production 500 responses

**Severity**: 🔴 CRITICAL
**Files**: `authController.js` (10 instances), `verifyOtpController.js` (1), `prescriptionController.js` (1), `auth.js` middleware (1)

### Root Cause

`errorHandler.js` correctly masks 5xx error details in production — but only when errors reach it via `next(err)`. These controllers catch their own errors and call `res.status(500).json(...)` directly, bypassing the error handler entirely. Internal error messages, file paths, and database error strings are returned to the client in production.

```js
// ❌ Current — bypasses errorHandler, leaks internals in production
} catch (error) {
  res.status(500).json({
    success: false,
    message: 'Failed to initiate registration',
    error: error.message  // ← leaks stack details, DB messages, file paths
  });
}
```

### Fix

Two options — pick one and apply consistently:

**Option A** (Recommended) — Remove the `error` field from all 500 responses:
```js
// ✅ Safe — no internal details leak
} catch (error) {
  logger.error('Registration initiation error:', error); // keep logging
  res.status(500).json({
    success: false,
    message: 'Failed to initiate registration'
    // no error field
  });
}
```

**Option B** — Route through errorHandler with conditional field:
```js
// ✅ Also safe — errorHandler masks in production
} catch (error) {
  next(error);
}
// errorHandler already handles: isProduction && statusCode >= 500 → mask message
```

### Subtasks

- [ ] **2.1** Fix `auth.js` middleware — line 66: remove `error: error.message` from the 500 response
- [ ] **2.2** Fix `authController.js` — remove `error: error.message` from all 10 catch blocks:
  - `initiateRegistration` (~line 92)
  - `completeRegistration` (~line 220)
  - `login` (~line 354)
  - `refreshToken` (~line 437)
  - `logout` (~line 469)
  - `logoutAll` (~line 500)
  - `getCurrentUser` (~line 531)
  - `forgotPassword` (~line 596)
  - `resetPassword` (~line 677)
  - `verifyEmail` (~line 717)
- [ ] **2.3** Fix `verifyOtpController.js` — line 52: remove `error: error.message`
- [ ] **2.4** Fix `prescriptionController.js` — line 424: remove `error: error.message`
- [ ] **2.5** Run a codebase-wide audit to catch any missed instances:
  ```bash
  grep -rn "error: error.message" src/
  ```
- [ ] **2.6** For development-only debugging, gate behind `NODE_ENV`:
  ```js
  ...(process.env.NODE_ENV === 'development' && { error: error.message })
  ```
- [ ] **2.7** Verify in production mode that 500 responses return only `{ success: false, message: '...' }`

---

## ISSUE 3 — Queue number race condition

**Severity**: 🔴 CRITICAL
**File**: `backend/src/controllers/queueController.js` — lines 107–117

### Root Cause

The queue number assignment is a non-atomic read-then-write. Two patients joining simultaneously both read `queueCount = 5`, both compute `queueNumber = 6`, and both get the same queue number. In a busy clinic, this causes duplicate queue numbers and incorrect ordering.

```js
// ❌ NOT atomic — race condition
const queueCount = await Queue.countDocuments({
  doctor: doctorId,
  status: { $in: ['waiting', 'in-progress'] }
});

const queueEntry = await Queue.create({
  queueNumber: queueCount + 1, // Two requests see same count → same number
  ...
});
```

### Fix

Use a MongoDB atomic counter with `$inc`:

```js
// ✅ Option A — atomic per-doctor counter document
// Create a new model: src/models/QueueCounter.js
import mongoose from 'mongoose';
const queueCounterSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  seq: { type: Number, default: 0 }
});
export default mongoose.model('QueueCounter', queueCounterSchema);

// In queueController.js joinQueue:
import QueueCounter from '../models/QueueCounter.js';

const counter = await QueueCounter.findOneAndUpdate(
  { doctorId },
  { $inc: { seq: 1 } },
  { upsert: true, new: true }
);

const queueEntry = await Queue.create({
  queueNumber: counter.seq,
  ...
});
```

```js
// ✅ Option B — unique index + retry on conflict (simpler, no new model)
// In Queue.js model, add:
queueSchema.index({ doctor: 1, queueNumber: 1 }, { unique: true });

// In controller, wrap create in try/catch for duplicate key:
let queueNumber = queueCount + 1;
let retries = 3;
while (retries > 0) {
  try {
    const queueEntry = await Queue.create({ queueNumber, ... });
    break;
  } catch (err) {
    if (err.code === 11000) { queueNumber++; retries--; }
    else throw err;
  }
}
```

### Subtasks

- [ ] **3.1** Choose Option A (atomic counter) or Option B (unique index + retry)
- [ ] **3.2** If Option A: create `src/models/QueueCounter.js` with the schema above
- [ ] **3.3** If Option A: import `QueueCounter` in `queueController.js`
- [ ] **3.4** Replace the `countDocuments` + `queueNumber: queueCount + 1` block with the atomic version
- [ ] **3.5** If Option B: add the unique compound index to `Queue.js`
- [ ] **3.6** Write a test that fires 10 concurrent `POST /api/v1/queue/join` requests for the same doctor — verify all queue numbers are unique and sequential

---

## ISSUE 4 — Encryption keys co-located with encrypted data

**Severity**: 🟠 HIGH
**File**: `backend/src/models/MedicalRecord.js`

### Root Cause

Each medical record stores its own `encryptionKey` in the same MongoDB document as the encrypted data. `select: false` prevents accidental API exposure, but does not help if the database is compromised — an attacker gets both ciphertext and keys in one query. The AES-256-GCM encryption provides zero protection against a database breach.

```js
// ❌ Key and ciphertext in the same document
const medicalRecordSchema = new mongoose.Schema({
  ...encryptedData,
  encryptionKey: { type: String, select: false } // same collection
});
```

### Fix

**Option A** (Minimum viable): Wrap record keys with a master key from the environment. The DB stores only wrapped keys — useless without `ENCRYPTION_KEY`:

```js
// In encryption.service.js — add key wrapping
export const wrapKey = (recordKey) => {
  const masterKey = process.env.ENCRYPTION_KEY; // 32-char env var
  const { encrypted, iv, authTag } = encrypt(recordKey, masterKey);
  return `${encrypted}:${iv}:${authTag}`; // store this, not the raw key
};

export const unwrapKey = (wrappedKey) => {
  const [encrypted, iv, authTag] = wrappedKey.split(':');
  const masterKey = process.env.ENCRYPTION_KEY;
  return decrypt(encrypted, iv, authTag, masterKey);
};
```

**Option B** (Production-grade): Move keys to a separate `RecordKeys` collection with a different access path, or use a managed KMS (AWS KMS, Google Cloud KMS).

### Subtasks

- [ ] **4.1** Add `wrapKey()` and `unwrapKey()` functions to `encryption.service.js`
- [ ] **4.2** In `recordController.js` `uploadRecord` — wrap the generated key before storing:
  ```js
  const encryptionKey = wrapKey(generateEncryptionKey());
  ```
- [ ] **4.3** In `recordController.js` wherever `encryptionKey` is read for decryption — unwrap before use:
  ```js
  const rawKey = unwrapKey(record.encryptionKey);
  ```
- [ ] **4.4** Write a migration script for existing records that have unwrapped keys stored
- [ ] **4.5** Update `ENCRYPTION_KEY` rotation docs — document that rotating it requires re-wrapping all stored keys (not re-encrypting records)
- [ ] **4.6** Add `ENCRYPTION_KEY` to `validateEnv.js` length check:
  ```js
  if (process.env.ENCRYPTION_KEY?.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
  }
  ```

---

## ISSUE 5 — Two emergency controller files — dead code

**Severity**: 🟠 HIGH
**Files**: `backend/src/controllers/emergency.controller.js` (365 lines) and `backend/src/controllers/emergencyAccessController.js` (507 lines)

### Root Cause

Two separate controllers implement overlapping emergency access logic. One is imported by routes, the other is dead code. Having both creates confusion about which is authoritative, risks divergence, and will cause a bug when someone edits the dead file expecting it to have an effect.

### Fix

Identify which file is actually used by routes, delete the other, and consolidate any unique logic.

### Subtasks

- [ ] **5.1** Run to identify which controller is imported by routes:
  ```bash
  grep -rn "emergency.controller\|emergencyAccessController" src/routes/
  ```
- [ ] **5.2** Open both files — diff them to identify any logic that exists in the dead file but not the live one
- [ ] **5.3** Port any missing logic from the dead file into the live controller
- [ ] **5.4** Delete the dead controller file
- [ ] **5.5** Search for any stray imports of the deleted file across the codebase:
  ```bash
  grep -rn "emergency.controller\|emergencyAccessController" src/
  ```
- [ ] **5.6** Verify all emergency access routes still work end-to-end after deletion

---

## ISSUE 6 — N+1 queries in getDoctorQueue

**Severity**: 🟠 HIGH
**File**: `backend/src/controllers/queueController.js` — `getDoctorQueue` function

### Root Cause

`calculatePosition()` is called for every waiting queue entry in a separate DB query. With 30 patients, this fires 31 queries (1 for the list + 30 for positions). Under load this is a significant performance problem.

```js
// ❌ N+1 — one DB call per entry
const queueWithPositions = await Promise.all(
  queue.map(async (entry) => {
    const position = await entry.calculatePosition(); // DB query per entry
    ...
  })
);
```

### Fix

Calculate all positions in memory using the already-fetched sorted array:

```js
// ✅ O(n) in memory — no extra DB calls
const waitingQueue = queue.filter(e => e.status === 'waiting');
// waitingQueue is already sorted by priority desc, checkInTime asc

const queueWithPositions = queue.map((entry) => {
  let position = null;
  if (entry.status === 'waiting') {
    position = waitingQueue.findIndex(e => e._id.equals(entry._id)) + 1;
  }
  return {
    ...entry.toObject(),
    position,
    waitDuration: entry.waitDuration
  };
});
```

### Subtasks

- [ ] **6.1** In `getDoctorQueue`, extract the waiting entries from the already-fetched `queue` array into `waitingQueue`
- [ ] **6.2** Replace the `Promise.all(queue.map(async ...calculatePosition()))` block with the in-memory position calculation above
- [ ] **6.3** Verify the `queue` array is sorted by priority + checkInTime before position calculation (it is — the JS `.sort()` is applied before this block)
- [ ] **6.4** Load test the endpoint with 50+ queue entries — confirm single-digit query count in MongoDB logs

---

## ISSUE 7 — recharts installed in backend

**Severity**: 🟠 HIGH
**File**: `backend/package.json`

### Root Cause

`recharts` is a React charting library. It has no use in a Node.js/Express backend. Its presence inflates the production bundle, may introduce React as an accidental transitive dependency, and signals the `package.json` was not reviewed before deployment.

```json
// ❌ backend/package.json
"recharts": "^3.7.0"
```

### Subtasks

- [ ] **7.1** Remove `recharts` from `backend/package.json` dependencies
- [ ] **7.2** Run `npm install` in `/backend` to update `package-lock.json`
- [ ] **7.3** Search backend source for any accidental recharts import:
  ```bash
  grep -rn "recharts" backend/src/
  ```
- [ ] **7.4** Confirm `recharts` is present and correct in `frontend/package.json` (it should be there)
- [ ] **7.5** Run `npm run dev` in backend — confirm it still starts without errors

---

## ISSUE 8 — No HTTPS enforcement

**Severity**: 🟠 HIGH
**File**: `backend/src/server.js`

### Root Cause

No HTTP → HTTPS redirect or HSTS header in production. Medical data (PHI) sent over HTTP is transmitted in plaintext. Most deployment platforms (Railway, Render, Heroku) handle TLS termination at the load balancer and forward requests to the app via HTTP internally — this is why the redirect is needed at the app level.

### Fix

```js
// ✅ Add to server.js, after middleware setup, before routes
if (process.env.NODE_ENV === 'production') {
  // Redirect HTTP to HTTPS (platform terminates TLS, adds x-forwarded-proto)
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });

  // HSTS: tell browsers to only use HTTPS for 1 year
  app.use(helmet.hsts({
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }));
}
```

### Subtasks

- [ ] **8.1** Add the HTTP → HTTPS redirect middleware to `server.js` — place it as the **first** middleware before helmet/cors/etc
- [ ] **8.2** Add `helmet.hsts()` configuration for production
- [ ] **8.3** Add `TRUST_PROXY` env var and call `app.set('trust proxy', 1)` so `req.headers['x-forwarded-proto']` is populated correctly behind a load balancer:
  ```js
  if (process.env.TRUST_PROXY) app.set('trust proxy', 1);
  ```
- [ ] **8.4** Add `TRUST_PROXY=1` to `backend/.env.example` with a comment explaining when to use it
- [ ] **8.5** Test that `http://yourdomain.com/api/health` redirects to `https://` in production
- [ ] **8.6** Test that `https://yourdomain.com/api/health` works directly

---

## ISSUE 9 — Zero test files

**Severity**: 🟡 MEDIUM (🔴 Disqualifier for recruiters)
**File**: `backend/` — `jest` + `supertest` are installed but no `*.test.js` files exist

### Root Cause

Testing infrastructure is set up (`jest`, `supertest` in devDependencies, `npm test` script configured) but no tests were written. For a healthcare platform handling medical records and real-time queue management, the absence of tests is the first question any senior engineer will ask.

### Fix

Write integration tests using `supertest` against a test MongoDB instance. Aim for coverage of the happy path + key failure modes for each domain.

### Subtasks

**Setup**
- [ ] **9.1** Create `backend/src/__tests__/` directory
- [ ] **9.2** Create `backend/jest.config.js`:
  ```js
  export default {
    testEnvironment: 'node',
    transform: {},
    extensionsToTreatAsEsm: ['.js'],
    moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' }
  };
  ```
- [ ] **9.3** Create `backend/src/__tests__/helpers/testSetup.js` — connects to a test DB, seeds minimal data, exports `app`
- [ ] **9.4** Add `TEST_MONGODB_URI` to `.env.example`

**Auth tests** (`__tests__/auth.test.js`)
- [ ] **9.5** Test: `POST /api/v1/auth/register/initiate` — valid input returns 200 + sessionId
- [ ] **9.6** Test: `POST /api/v1/auth/register/initiate` — duplicate email returns 409
- [ ] **9.7** Test: `POST /api/v1/auth/register/complete` — invalid OTP returns 400
- [ ] **9.8** Test: `POST /api/v1/auth/login` — valid credentials return 200 + tokens
- [ ] **9.9** Test: `POST /api/v1/auth/login` — wrong password returns 401
- [ ] **9.10** Test: `POST /api/v1/auth/login` — locked account returns 423
- [ ] **9.11** Test: `POST /api/v1/auth/refresh-token` — valid refresh returns new access token
- [ ] **9.12** Test: `POST /api/v1/auth/refresh-token` — expired token returns 401

**Queue tests** (`__tests__/queue.test.js`)
- [ ] **9.13** Test: `POST /api/v1/queue/join` — patient joins queue successfully
- [ ] **9.14** Test: `POST /api/v1/queue/join` — patient already in queue returns 400
- [ ] **9.15** Test: `GET /api/v1/queue/stats` — returns non-empty data (regression test for Issue 1 fix)
- [ ] **9.16** Test: `POST /api/v1/queue/call-next` — doctor calls next patient, correct priority order

**Consent tests** (`__tests__/consent.test.js`)
- [ ] **9.17** Test: Doctor cannot access records without consent — returns 403
- [ ] **9.18** Test: Patient grants consent → doctor can access record
- [ ] **9.19** Test: Patient revokes consent → doctor access denied again

**Middleware tests**
- [ ] **9.20** Test: Unauthenticated request to protected route returns 401
- [ ] **9.21** Test: Patient role cannot access `/api/v1/admin` routes — returns 403

---

## ISSUE 10 — OTP has no attempt lockout

**Severity**: 🟡 MEDIUM
**File**: `backend/src/controllers/authController.js` — `completeRegistration` and `resetPassword`

### Root Cause

Rate limiting (5 req/min) exists on the OTP endpoints, but there is no counter for failed OTP verification attempts on a specific session. Over one hour, an attacker can make 300 attempts against a 6-digit OTP (1,000,000 combinations). With enough time, brute force is viable.

### Fix

Use a Redis counter per session to lock out after 5 failed attempts:

```js
// ✅ Add to OTP verification logic in completeRegistration and resetPassword
const attemptsKey = `otp_attempts:${sessionId}`;

// Check attempt count before verification
const attempts = await redisClient.incr(attemptsKey);
if (attempts === 1) {
  // Set expiry on first attempt (TTL matches OTP session TTL)
  await redisClient.expire(attemptsKey, 10 * 60); // 10 min
}
if (attempts > 5) {
  await deleteOTP(sessionId); // invalidate the session
  return res.status(429).json({
    success: false,
    message: 'Too many failed attempts. Please request a new OTP.'
  });
}

// Verify OTP
if (!verifyOTP(otp, otpData.otp)) {
  return res.status(400).json({
    success: false,
    message: `Invalid OTP. ${5 - attempts} attempts remaining.`
  });
}

// On success — clean up attempt counter
await redisClient.del(attemptsKey);
```

### Subtasks

- [ ] **10.1** Import `redisClient` in `authController.js` (if not already imported)
- [ ] **10.2** Add attempt counter logic to `completeRegistration` — before the `verifyOTP()` call
- [ ] **10.3** Add attempt counter logic to `resetPassword` — before the `verifyOTP()` call
- [ ] **10.4** On successful OTP verification — delete the attempts key with `redisClient.del(attemptsKey)`
- [ ] **10.5** On session expiry — the attempts key expires automatically with Redis TTL
- [ ] **10.6** Test: Submit wrong OTP 6 times — verify 7th attempt returns 429 and session is invalidated
- [ ] **10.7** Test: Correct OTP clears the attempt counter — verify a new OTP request starts fresh

---

## ISSUE 11 — No CI/CD pipeline

**Severity**: 🟡 MEDIUM
**File**: Missing — no `.github/workflows/` directory

### Root Cause

No automated checks run on pull requests or pushes to main. Code can be merged without passing lint, tests, or even a basic build check.

### Fix

Create a GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    services:
      mongodb:
        image: mongo:7
        ports: ['27017:27017']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18', cache: 'npm', cache-dependency-path: backend/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm test
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/mediqueue_test
          REDIS_URL: redis://localhost:6379
          JWT_ACCESS_SECRET: test_access_secret_32_chars_minimum
          JWT_REFRESH_SECRET: test_refresh_secret_32_chars_minimum
          JWT_MFA_SECRET: test_mfa_secret_here_32_chars_ok
          ENCRYPTION_KEY: test_encryption_key_32chars!

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18', cache: 'npm', cache-dependency-path: frontend/package-lock.json }
      - run: npm ci
      - run: npm run build
        env:
          VITE_API_URL: http://localhost:5000/api/v1
          VITE_SOCKET_URL: http://localhost:5000
```

### Subtasks

- [x] **11.1** Create `.github/workflows/` directory at project root
- [x] **11.2** Create `.github/workflows/ci.yml` with the backend job (lint + test)
- [x] **11.3** Create `.github/workflows/ci.yml` with the frontend job (build check)
- [x] **11.4** Add GitHub Actions secrets for any env vars needed in CI (`JWT_ACCESS_SECRET`, etc.)
- [ ] **11.5** Add a branch protection rule on `main`: require CI to pass before merge
- [x] **11.6** Verify the pipeline passes on first run

---

## ISSUE 12 — No Docker setup

**Severity**: 🟡 MEDIUM
**File**: Missing — no `Dockerfile` or `docker-compose.yml`

### Root Cause

There is no containerization setup. Anyone cloning this repo must manually install and configure MongoDB and Redis before the app runs. This creates friction for reviewers, collaborators, and deployment pipelines.

### Fix

```yaml
# docker-compose.yml (project root)
version: '3.9'
services:
  mongodb:
    image: mongo:7
    restart: unless-stopped
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: mediqueue

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    build: ./backend
    restart: unless-stopped
    ports:
      - '5000:5000'
    env_file: ./backend/.env
    depends_on:
      - mongodb
      - redis
    environment:
      MONGODB_URI: mongodb://mongodb:27017/mediqueue
      REDIS_URL: redis://redis:6379

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - '5173:80'
    env_file: ./frontend/.env
    depends_on:
      - backend

volumes:
  mongo_data:
  redis_data:
```

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
EXPOSE 5000
CMD ["node", "src/server.js"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Subtasks

- [x] **12.1** Create `docker-compose.yml` at project root with MongoDB + Redis + backend + frontend services
- [x] **12.2** Create `backend/Dockerfile` with multi-stage build (deps → production)
- [x] **12.3** Create `frontend/Dockerfile` with multi-stage build (node build → nginx serve)
- [x] **12.4** Create `frontend/nginx.conf` for React Router SPA routing:
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```
- [x] **12.5** Add `docker-compose.yml` quick-start to `README.md`:
  ```bash
  cp backend/.env.example backend/.env  # fill in values
  docker-compose up --build
  ```
- [x] **12.6** Add `.dockerignore` to both `backend/` and `frontend/` — exclude `node_modules`, `.env`, `*.log`
- [x] **12.7** Test full stack boots with `docker-compose up` and all health checks pass

---

## ISSUE 13 — Missing indexes on core models

**Severity**: 🔵 LOW
**Files**: `backend/src/models/Appointment.js`, `backend/src/models/Consent.js`, `backend/src/models/AuditLog.js`

### Root Cause

Queue and MedicalRecord have indexes. Appointment, Consent, and AuditLog — which are queried frequently — do not. As data grows, queries on these collections will become full collection scans.

### Fix

```js
// Appointment.js — add after schema definition
appointmentSchema.index({ patient: 1, startTime: -1 });
appointmentSchema.index({ doctor: 1, startTime: 1, status: 1 });
appointmentSchema.index({ status: 1, startTime: 1 }); // for scheduler queries

// Consent.js
consentSchema.index({ patient: 1, doctor: 1, status: 1 });
consentSchema.index({ specificRecords: 1 }); // for record-level consent checks

// AuditLog.js
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 }); // for admin time-range queries
```

### Subtasks

- [ ] **13.1** Add indexes to `Appointment.js`
- [ ] **13.2** Add indexes to `Consent.js`
- [ ] **13.3** Add indexes to `AuditLog.js`
- [ ] **13.4** Run `db.collection.getIndexes()` in MongoDB shell after deploy to confirm indexes are created
- [ ] **13.5** For existing production data: ensure indexes are built with `{ background: true }` to avoid locking

---

## ISSUE 14 — node-cron has no distributed lock

**Severity**: 🔵 LOW
**File**: `backend/src/services/appointmentScheduler.js`

### Root Cause

`node-cron` jobs start on server boot. If you ever run 2+ backend instances (horizontal scaling, rolling deploys), cron jobs run on every instance simultaneously — patients receive duplicate appointment reminders and duplicate audit log entries are created.

### Fix

Use a Redis distributed lock — only the instance that acquires the lock runs the job:

```js
// ✅ Wrap cron job body with Redis lock
import redisClient from '../config/redis.js';

const withDistributedLock = async (lockKey, ttlSeconds, fn) => {
  const lockValue = `${process.pid}-${Date.now()}`;
  const acquired = await redisClient.set(lockKey, lockValue, 'NX', 'EX', ttlSeconds);

  if (!acquired) {
    logger.info(`Cron ${lockKey}: lock held by another instance, skipping`);
    return;
  }

  try {
    await fn();
  } finally {
    // Only release if we still own it
    const current = await redisClient.get(lockKey);
    if (current === lockValue) await redisClient.del(lockKey);
  }
};

// In your cron job:
cron.schedule('0 * * * *', async () => {
  await withDistributedLock('cron:appointment-reminders', 3600, async () => {
    // actual reminder logic
  });
});
```

### Subtasks

- [ ] **14.1** Create `src/utils/distributedLock.js` with the `withDistributedLock` helper above
- [ ] **14.2** Wrap each cron job in `appointmentScheduler.js` with `withDistributedLock`
- [ ] **14.3** Use a unique `lockKey` per job (e.g. `cron:24h-reminders`, `cron:1h-reminders`)
- [ ] **14.4** Set TTL slightly shorter than the cron interval to prevent lock starvation
- [ ] **14.5** Test by running two backend instances simultaneously — verify reminders are sent only once

---

## Summary Table

| # | Issue | Severity | Effort | Priority |
|---|---|---|---|---|
| 1 | Queue stats always empty (ObjectId cast) | 🔴 CRITICAL | 30 min | **Do now** |
| 2 | `error.message` leaks in production | 🔴 CRITICAL | 1 hr | **Do now** |
| 3 | Queue number race condition | 🔴 CRITICAL | 2 hrs | **Do now** |
| 4 | Encryption keys co-located with data | 🟠 HIGH | 3 hrs | Before launch |
| 5 | Dead emergency controller | 🟠 HIGH | 30 min | Before launch |
| 6 | N+1 queries in getDoctorQueue | 🟠 HIGH | 1 hr | Before launch |
| 7 | recharts in backend | 🟠 HIGH | 10 min | Before launch |
| 8 | No HTTPS enforcement | 🟠 HIGH | 1 hr | Before launch |
| 9 | Zero tests | 🟡 MEDIUM | 4–6 hrs | Before sharing with recruiter |
| 10 | OTP no attempt lockout | 🟡 MEDIUM | 1 hr | Before launch |
| 11 | No CI/CD pipeline | 🟡 MEDIUM | 2 hrs | Before launch |
| 12 | No Docker setup | 🟡 MEDIUM | 2 hrs | Before sharing |
| 13 | Missing indexes | 🔵 LOW | 30 min | Before production traffic |
| 14 | No distributed cron lock | 🔵 LOW | 2 hrs | Before horizontal scaling |

---

*Last reviewed: March 2026 — based on full source code audit of backend + frontend.*
