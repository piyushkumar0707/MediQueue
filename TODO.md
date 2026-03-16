# TODO.md — MediQueue / CareQueue Issue Resolution Plan

> **Purpose:** Step-by-step resolution guide for all 29 issues identified in ISSUE.md
> **Total Tasks:** 29 · Each task is broken into actionable subtasks
> **Recommended Order:** Work top-to-bottom — Criticals first, then High, Medium, Low

---

## How to use this file

- `[ ]` = Not started
- `[x]` = Done
- Each task references its ISSUE-XXX ID for cross-referencing
- Subtasks are ordered — complete them in sequence unless noted otherwise

---

## 🔴 CRITICAL Tasks

---

### TODO-001 · Remove tokens from localStorage — use httpOnly cookies only
**Fixes:** ISSUE-001
**File:** `frontend/src/store/useAuthStore.js`

- [ ] **1.1** Open `useAuthStore.js` and locate the `persist` middleware `partialize` config
- [ ] **1.2** Remove `accessToken` and `refreshToken` from the `partialize` return object — keep only `user` and `isAuthenticated`
- [ ] **1.3** Remove `accessToken` and `refreshToken` from the Zustand state definition (they will now live only in the httpOnly cookie managed by the browser)
- [ ] **1.4** Update the `login` action to no longer extract or store `accessToken` / `refreshToken` from the response body
- [ ] **1.5** Update `completeRegistration` similarly — remove token extraction from response
- [ ] **1.6** Open `frontend/src/services/api.js` — locate the Axios request interceptor that attaches `Authorization: Bearer <token>`. Remove it entirely (the browser will now attach cookies automatically)
- [ ] **1.7** Verify the Axios instance has `withCredentials: true` set so cookies are sent on every cross-origin request
- [ ] **1.8** Update `refreshAccessToken` in the store — it no longer needs to read/write a token from state; the server refresh endpoint will read the httpOnly cookie and set a new one
- [ ] **1.9** Update `logout` — remove `localStorage.removeItem('auth-storage')` for tokens; the logout API call to the server will clear the cookie server-side
- [ ] **1.10** Confirm backend `Set-Cookie` response headers are present with `httpOnly: true`, `secure: true` (production), and `sameSite: 'Strict'`
- [ ] **1.11** Test: log in, inspect Application → Local Storage in devtools — confirm no token is present. Inspect Cookies — confirm `accessToken` cookie exists with `HttpOnly` flag

---

### TODO-002 · Authenticate Socket.io connections server-side
**Fixes:** ISSUE-002, ISSUE-029
**Files:** `backend/src/server.js`, `frontend/src/pages/admin/Dashboard.jsx`

- [ ] **2.1** On the backend, install or import the existing JWT verify utility at the top of `server.js`
- [ ] **2.2** Add a Socket.io middleware (before the connection handler) that extracts and verifies the auth token from the handshake:
  ```js
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = payload; // attach decoded user to socket
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });
  ```
- [ ] **2.3** In the `join` event handler, replace the client-supplied `role` with `socket.user.role` (from the verified token) — never trust the client-sent role
- [ ] **2.4** Replace the client-supplied `userId` with `socket.user.userId` (or `socket.user.id`) from the verified token
- [ ] **2.5** On the frontend, in `AdminDashboard.jsx`, pass the auth token in the socket handshake options:
  ```js
  const { accessToken } = useAuthStore.getState();
  socketRef.current = io(BACKEND_URL, {
    auth: { token: accessToken },
    transports: ['websocket', 'polling'],
  });
  ```
- [ ] **2.6** If tokens are moved to httpOnly cookies (TODO-001), update the socket auth strategy to use a dedicated short-lived socket token obtained from a `/auth/socket-token` endpoint, or use cookie-based auth with `socket.io`'s cookie parser middleware
- [ ] **2.7** Test: attempt to connect a WebSocket client without a valid token — confirm connection is rejected with an auth error

---

### TODO-003 · Fix emergency access notification status messaging
**Fixes:** ISSUE-003
**File:** `backend/src/controllers/emergencyAccessController.js`

- [ ] **3.1** Locate the patient `Notification.create` call inside `requestEmergencyAccess`
- [ ] **3.2** Change `title` from `'Emergency Access Granted'` to `'Emergency Access Requested'`
- [ ] **3.3** Update the `message` body to clarify that the request is pending admin review:
  ```
  "Dr. [name] has requested emergency access to your medical records due to: [type]. 
   This request is pending administrator review."
  ```
- [ ] **3.4** Locate the admin `Notification.create` calls and ensure their titles accurately reflect the pending state (e.g., `'New Emergency Access Request — Pending Approval'`)
- [ ] **3.5** After ISSUE-004 is fixed (doctor name resolved), confirm the notification content reads correctly end-to-end
- [ ] **3.6** Add a follow-up notification to the patient when admin approves or denies the request (in the admin review controller)

---

### TODO-004 · Fix doctor name in emergency notifications — use personalInfo path
**Fixes:** ISSUE-004
**File:** `backend/src/controllers/emergencyAccessController.js`

- [ ] **4.1** Locate all four notification `message` strings in `requestEmergencyAccess` that reference `req.user.firstName` and `req.user.lastName`
- [ ] **4.2** Replace each reference:
  - `req.user.firstName` → `req.user.personalInfo?.firstName || 'Unknown'`
  - `req.user.lastName` → `req.user.personalInfo?.lastName || ''`
- [ ] **4.3** Confirm the auth JWT middleware (`auth.js`) populates `req.user` with the full user document (or at minimum the `personalInfo` subdocument) — if it only decodes the JWT payload, add a DB lookup or include `personalInfo` fields when signing the token
- [ ] **4.4** Search the entire codebase for any other controller that uses `req.user.firstName` or `req.user.lastName` directly — apply the same fix to each occurrence
- [ ] **4.5** Write a test or manual verification: create an emergency access request and confirm the patient notification reads "Dr. [FirstName] [LastName]" correctly

---

### TODO-005 · Fix prescription number race condition with atomic counter
**Fixes:** ISSUE-005
**File:** `backend/src/models/Prescription.js`

- [ ] **5.1** Create a new Mongoose model `Counter` (or reuse one if it exists) with a single document per counter key using MongoDB's `findOneAndUpdate` with `$inc` and `upsert: true` — this is inherently atomic
  ```js
  const Counter = mongoose.model('Counter', new mongoose.Schema({
    _id: String, seq: { type: Number, default: 0 }
  }));
  ```
- [ ] **5.2** In the Prescription `pre('save')` hook, replace the `findOne → sort → increment` logic with:
  ```js
  const counter = await Counter.findOneAndUpdate(
    { _id: `prescription-${prefix}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  this.prescriptionNumber = `${prefix}-${String(counter.seq).padStart(4, '0')}`;
  ```
- [ ] **5.3** Remove the old `findOne + sort` logic entirely
- [ ] **5.4** Add a migration script to seed the Counter collection with the current maximum sequence value for each month prefix already in the database (so counters start from the right number, not 1)
- [ ] **5.5** Test with concurrent requests: simulate two simultaneous POST `/api/prescriptions` and confirm both receive unique prescription numbers with no 500 error

---

### TODO-006 · Standardise user ID field across all controllers
**Fixes:** ISSUE-006
**Files:** `backend/src/middleware/auth.js`, all controllers

- [ ] **6.1** Open `backend/src/middleware/auth.js` and determine exactly what properties are set on `req.user` after JWT verification (e.g., `id`, `userId`, `_id`, `role`)
- [ ] **6.2** Pick one canonical field name — recommend `userId` — and ensure the middleware always sets it:
  ```js
  req.user = { userId: decoded.id || decoded.userId, role: decoded.role, ... };
  ```
- [ ] **6.3** Search the entire backend for `req.user.id` (not `req.user.userId`) and replace every instance with the chosen canonical name
- [ ] **6.4** Search for `req.user.userId` — verify all instances match the canonical name
- [ ] **6.5** Do a final search for `req.user._id` — normalise those too
- [ ] **6.6** Run the app and test at least one endpoint per controller group (auth, queue, appointments, records, consent, emergency, notifications) to confirm the authenticated user is resolved correctly

---

### TODO-007 · Replace dynamic imports with static imports in mfaController
**Fixes:** ISSUE-007
**File:** `backend/src/controllers/mfaController.js`

- [ ] **7.1** Add static imports at the top of `mfaController.js`:
  ```js
  import jwt from 'jsonwebtoken';
  import { generateTokenPair } from '../utils/jwt.js';
  import AuditLog from '../models/AuditLog.js';
  ```
- [ ] **7.2** Remove the three `await import(...)` calls from inside `validateMfa`
- [ ] **7.3** If these were dynamic to avoid a circular dependency (e.g., `jwt.js` imports something from `mfaController.js`), resolve the circular dependency by extracting the shared code into a separate utility module (e.g., `backend/src/utils/tokenUtils.js`)
- [ ] **7.4** Restart the server and confirm `POST /api/auth/mfa/validate` still functions correctly
- [ ] **7.5** Run a profiling check to confirm MFA validation latency is reduced

---

## 🟠 HIGH Tasks

---

### TODO-008 · Fix medications field name mismatch in PatientRecords
**Fixes:** ISSUE-008
**File:** `frontend/src/pages/doctor/PatientRecords.jsx`

- [ ] **8.1** Open `PatientRecords.jsx` and search for `prescription.medications`
- [ ] **8.2** Replace `.medications?.map(` with `.medicines?.map(` to match the Prescription model field name
- [ ] **8.3** Search the entire frontend for any other occurrence of `.medications` on a prescription object and fix accordingly
- [ ] **8.4** Test: navigate to a patient's records as a doctor — confirm the medications list is now populated

---

### TODO-009 · Add pagination limit cap to all paginated controllers
**Fixes:** ISSUE-009
**Files:** All backend controllers with pagination

- [ ] **9.1** Create a shared utility function in `backend/src/utils/`:
  ```js
  // paginationUtils.js
  export const parsePagination = (query, defaultLimit = 10, maxLimit = 100) => ({
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(parseInt(query.limit, 10) || defaultLimit, maxLimit)
  });
  ```
- [ ] **9.2** Import and use `parsePagination` in `emergencyAccessController.js` — replace the raw destructured `page`, `limit`
- [ ] **9.3** Apply the same replacement in `appointmentController.js`
- [ ] **9.4** Apply in `queueController.js`
- [ ] **9.5** Apply in `recordController.js`
- [ ] **9.6** Apply in `notificationController.js`
- [ ] **9.7** Apply in `admin.controller.js` (`getRecentUsers` and similar)
- [ ] **9.8** Apply in `audit.controller.js`
- [ ] **9.9** Test: call any paginated endpoint with `?limit=99999` — confirm the response returns at most 100 results

---

### TODO-010 · Fix getSharedWithDoctor to scope expiry check to specific doctor
**Fixes:** ISSUE-010
**File:** `backend/src/models/MedicalRecord.js`

- [ ] **10.1** Open `MedicalRecord.js` and locate `getSharedWithDoctor`
- [ ] **10.2** Replace the top-level `$or` approach with MongoDB's `$elemMatch` to scope the condition to the specific doctor's subdocument:
  ```js
  return this.find({
    sharedWith: {
      $elemMatch: {
        doctor: doctorId,
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }
    },
    status: 'active'
  })
  ```
- [ ] **10.3** Remove the old separate `'sharedWith.doctor': doctorId` field condition (now embedded in `$elemMatch`)
- [ ] **10.4** Test with a record shared with two doctors where one sharing has expired — confirm only the non-expired doctor's query returns the record

---

### TODO-011 · Cast userId to ObjectId in consent stats aggregation
**Fixes:** ISSUE-011
**File:** `backend/src/controllers/consentController.js`

- [ ] **11.1** Add `import mongoose from 'mongoose';` at the top of `consentController.js` if not already present
- [ ] **11.2** In `getConsentStats`, wrap the userId in the aggregation `$match` with ObjectId casting:
  ```js
  $match: {
    patient: new mongoose.Types.ObjectId(req.user.userId),
    ...
  }
  ```
- [ ] **11.3** Search for any other aggregation pipelines in the codebase that use `req.user.userId` or `req.user.id` directly in a `$match` — apply the same fix
- [ ] **11.4** Test: call `GET /api/consent/stats` as a logged-in patient — confirm non-empty results are returned when consents exist

---

### TODO-012 · Replace validateBeforeSave: false with targeted field exclusion
**Fixes:** ISSUE-012
**File:** `backend/src/controllers/mfaController.js`

- [ ] **12.1** In `setupMfa`, replace `user.save({ validateBeforeSave: false })` — instead, use a targeted `updateOne` that only updates the `mfaSecret` field:
  ```js
  await User.updateOne({ _id: user._id }, { $set: { mfaSecret: secret.base32 } });
  ```
- [ ] **12.2** In `verifyMfaSetup`, replace the `validateBeforeSave: false` save with targeted `updateOne` for `mfaEnabled` and `mfaBackupCodes`
- [ ] **12.3** In `disableMfa`, replace with targeted `updateOne` clearing `mfaEnabled`, `mfaSecret`, and `mfaBackupCodes`
- [ ] **12.4** In `validateMfa` (the login completion step), the full user save updates `lastLoginAt`, `lastActiveAt`, and refresh tokens — review if all modified fields are safe to validate, or use a targeted `updateOne` for those fields
- [ ] **12.5** Test each MFA flow (enable, verify, disable, login) to confirm behaviour is unchanged

---

### TODO-013 · Remove duplicate doctor patient route
**Fixes:** ISSUE-013
**File:** `frontend/src/App.jsx`

- [ ] **13.1** Decide on the canonical route path — recommend `patients/:patientId/records` (plural, more RESTful)
- [ ] **13.2** Remove the duplicate `patient/:patientId` route from `App.jsx`
- [ ] **13.3** Search the entire frontend for any `navigate('/doctor/patient/...')` or `<Link to="/doctor/patient/...">` calls — update all to use the canonical path
- [ ] **13.4** Check `DoctorSidebar.jsx` and any breadcrumb/back navigation for hardcoded patient links
- [ ] **13.5** Test: navigate to a patient record from various entry points (queue, appointments, shared records) — confirm all routes resolve to the same correct page

---

### TODO-014 · Parallelise admin emergency notifications
**Fixes:** ISSUE-014
**File:** `backend/src/controllers/emergencyAccessController.js`

- [ ] **14.1** Replace the `for...of` loop with parallel execution:
  ```js
  const admins = await User.find({ role: 'admin' });
  await Promise.all(admins.map(async (admin) => {
    const notification = await Notification.create({
      recipient: admin._id,
      // ... rest of notification fields
    });
    await notificationService.sendNotification(notification);
  }));
  ```
- [ ] **14.2** Apply the same parallelisation to both notification blocks (the `flaggedForReview` and `!flaggedForReview` paths)
- [ ] **14.3** After fixing ISSUE-015 (unified blocks), apply once to the merged single block

---

### TODO-015 · Merge the duplicate admin notification blocks
**Fixes:** ISSUE-015
**File:** `backend/src/controllers/emergencyAccessController.js`

- [ ] **15.1** Identify the two admin notification blocks: one for `!flaggedForReview` and one for `flaggedForReview`
- [ ] **15.2** Merge them into a single block with a conditional on the notification type:
  ```js
  const notifType = emergencyAccess.flaggedForReview
    ? 'emergency_flagged'
    : 'emergency_access_pending';
  const notifTitle = emergencyAccess.flaggedForReview
    ? '🚨 Emergency Access Flagged for Review'
    : '🚨 New Emergency Access Request';
  
  await Promise.all(admins.map(async (admin) => {
    const notification = await Notification.create({ type: notifType, title: notifTitle, ... });
    await notificationService.sendNotification(notification);
  }));
  ```
- [ ] **15.3** Delete the original two separate loops
- [ ] **15.4** Test both flagged and non-flagged emergency access requests and confirm admins receive the correct notification type in each case

---

### TODO-016 · Use a dedicated secret for MFA session tokens
**Fixes:** ISSUE-016
**Files:** `backend/src/controllers/mfaController.js`, `.env.example`

- [ ] **16.1** Add a new environment variable to `.env.example`:
  ```
  JWT_MFA_SECRET=your_dedicated_mfa_secret_here
  ```
- [ ] **16.2** Add `JWT_MFA_SECRET` to the env validation in `backend/src/config/validateEnv.js`
- [ ] **16.3** In `authController.js` (where the `mfa_session` token is signed during login), change the signing secret from `JWT_ACCESS_SECRET` to `JWT_MFA_SECRET`
- [ ] **16.4** In `mfaController.js validateMfa`, change the verification to use `process.env.JWT_MFA_SECRET`
- [ ] **16.5** Update `.env` in all deployed/staging environments with the new secret
- [ ] **16.6** Test the full MFA login flow: confirm the session token is accepted during the MFA step and rejected after it expires

---

## 🟡 MEDIUM Tasks

---

### TODO-017 · Guard localStorage JSON.parse in AdminDashboard
**Fixes:** ISSUE-017
**File:** `frontend/src/pages/admin/Dashboard.jsx`

- [ ] **17.1** Wrap the state initialiser `localStorage.getItem` call in a try/catch:
  ```js
  const [widgetSettings, setWidgetSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboardWidgets');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  ```
- [ ] **17.2** Extract `defaultSettings` to a named constant above the component for reuse
- [ ] **17.3** Test: manually corrupt the `dashboardWidgets` key in localStorage and reload the Admin Dashboard — confirm it renders the default layout without crashing

---

### TODO-018 · Replace req.connection with req.socket or req.ip
**Fixes:** ISSUE-018
**Files:** All backend controllers that log IP addresses

- [ ] **18.1** Search the entire backend for `req.connection?.remoteAddress`
- [ ] **18.2** Replace every occurrence with just `req.ip` (Express always populates this; it respects `trust proxy` settings correctly)
- [ ] **18.3** If the fallback pattern `req.ip || req.connection?.remoteAddress` is used, simplify to just `req.ip`
- [ ] **18.4** Verify `app.set('trust proxy', 1)` is configured in `server.js` if the app runs behind a reverse proxy/load balancer (needed for `req.ip` to reflect the real client IP, not the proxy IP)

---

### TODO-019 · Add emergency access check to canUserAccess()
**Fixes:** ISSUE-019
**File:** `backend/src/models/MedicalRecord.js`

- [ ] **19.1** Add `EmergencyAccess` import to `MedicalRecord.js`
- [ ] **19.2** Convert `canUserAccess` to an async method (it currently returns synchronously):
  ```js
  medicalRecordSchema.methods.canUserAccess = async function(userId, userRole) {
  ```
- [ ] **19.3** Add the emergency access check as the last condition before returning `false`:
  ```js
  if (userRole === 'doctor') {
    const activeEmergency = await EmergencyAccess.findOne({
      doctor: userId,
      patient: this.patient,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });
    if (activeEmergency) return true;
  }
  return false;
  ```
- [ ] **19.4** Update all call sites of `canUserAccess` to `await` the result
- [ ] **19.5** Test: a doctor with active emergency access can view a record; after expiry they cannot

---

### TODO-020 · Replace limit * 1 with parseInt utility
**Fixes:** ISSUE-020
**Files:** Multiple backend controllers

- [ ] **20.1** This is resolved as part of TODO-009 (the `parsePagination` utility handles this). Verify all controllers use `parsePagination` and no `limit * 1` or `page * 1` patterns remain
- [ ] **20.2** Search for `* 1` in all controller files and replace any remaining instances with explicit `parseInt(..., 10) || defaultValue` calls
- [ ] **20.3** Pay special attention to `skip` calculations — ensure `(page - 1) * limit` uses the parsed integer values, not raw query strings

---

### TODO-021 · Expand audit log hash to cover full record
**Fixes:** ISSUE-021
**Files:** Multiple backend controllers that create audit logs

- [ ] **21.1** Create a shared `createAuditEntry` utility that assembles the full audit document first, hashes the entire payload, then saves:
  ```js
  // auditUtils.js
  export const createAuditLog = async (data) => {
    const hashString = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(hashString).digest('hex');
    return AuditLog.create({ ...data, hash });
  };
  ```
- [ ] **21.2** Replace all direct `AuditLog.create({ ..., hash: crypto... })` calls throughout the codebase with the new `createAuditLog` utility
- [ ] **21.3** Add a verification function `verifyAuditEntry(entry)` that recomputes the hash (excluding the `hash` field itself) and compares — this can be used in the audit review UI
- [ ] **21.4** Document the hash schema in `docs/AUDIT_COMPLIANCE_SYSTEM.md`

---

### TODO-022 · Add stricter rate limiting to auth endpoints
**Fixes:** ISSUE-022
**File:** `backend/src/routes/authRoutes.js`

- [ ] **22.1** Confirm `express-rate-limit` is installed (`npm list express-rate-limit`)
- [ ] **22.2** Create a strict auth rate limiter:
  ```js
  import rateLimit from 'express-rate-limit';
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,                      // 5 attempts per window
    message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  ```
- [ ] **22.3** Apply `authLimiter` to `POST /auth/login`
- [ ] **22.4** Apply `authLimiter` to `POST /auth/forgot-password`
- [ ] **22.5** Apply `authLimiter` to `POST /auth/mfa/validate`
- [ ] **22.6** Apply a slightly looser limiter (e.g., 10 per 15 minutes) to `POST /auth/register/initiate`
- [ ] **22.7** Test: make 6 rapid login attempts with wrong credentials — confirm the 6th returns HTTP 429

---

### TODO-023 · Remove console.error from production auth store
**Fixes:** ISSUE-023
**File:** `frontend/src/store/useAuthStore.js`

- [ ] **23.1** Delete the `console.error('API call error:', error)` line in `initiateRegistration`
- [ ] **23.2** Search the entire `useAuthStore.js` and `services/api.js` for any other `console.error` or `console.log` calls that log error or response objects
- [ ] **23.3** If structured logging is desired in development, wrap in `if (import.meta.env.DEV) { console.error(...) }` rather than logging unconditionally
- [ ] **23.4** Consider implementing a frontend error reporting service (e.g., Sentry) to capture production errors without exposing them in the console

---

### TODO-024 · Fix Toaster JSX placement and App.jsx indentation
**Fixes:** ISSUE-024
**File:** `frontend/src/App.jsx`

- [ ] **24.1** Move `<Toaster>` to be the first child inside `<Router>` and before `<Routes>`, with correct indentation that reflects the actual component tree
- [ ] **24.2** Move the closing `</Router>` tag to the correct position — it should close after `</Routes>` and after `</Toaster>` at the same nesting level
- [ ] **24.3** Run the frontend and confirm toasts still appear correctly across all pages

---

## 🟢 LOW Tasks

---

### TODO-025 · Move OTP store from memory to Redis
**Fixes:** ISSUE-025
**File:** `backend/src/utils/otpStore.js`

- [ ] **25.1** Open `otpStore.js` and confirm it uses an in-memory Map or object
- [ ] **25.2** Open `backend/src/config/redis.js` and confirm the Redis client is properly initialised and exported
- [ ] **25.3** Rewrite `otpStore.js` to use Redis with TTL:
  ```js
  import redis from '../config/redis.js';
  const OTP_TTL = 10 * 60; // 10 minutes in seconds
  
  export const setOtp = (sessionId, data) =>
    redis.setex(`otp:${sessionId}`, OTP_TTL, JSON.stringify(data));
  
  export const getOtp = async (sessionId) => {
    const raw = await redis.get(`otp:${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  };
  
  export const deleteOtp = (sessionId) =>
    redis.del(`otp:${sessionId}`);
  ```
- [ ] **25.4** Update all consumers of `otpStore.js` to `await` the async methods
- [ ] **25.5** Test: initiate registration, restart the server, attempt to complete registration with the same OTP — confirm it still validates correctly (because it's now in Redis, not memory)

---

### TODO-026 · Remove or safely handle emoji in notification titles
**Fixes:** ISSUE-026
**Files:** `backend/src/controllers/emergencyAccessController.js`, `consentController.js`, and any other controller with emoji in notification strings

- [ ] **26.1** Search all backend controller files for emoji characters in notification `title` or `message` strings
- [ ] **26.2** For notifications that may be delivered via SMS (`channels.sms: true`), remove emoji from the text entirely and use plain descriptive text (e.g., `'[URGENT] New Emergency Access Request'`)
- [ ] **26.3** For in-app only notifications (`channels.sms: false`, `channels.email: false`), emoji can be kept as they render fine in the browser
- [ ] **26.4** Alternatively, implement a `sanitizeForSms(text)` helper that strips non-ASCII characters before passing the message to the SMS gateway
- [ ] **26.5** Test: trigger an emergency access request and verify the SMS notification (if Twilio is configured) arrives with readable text

---

### TODO-027 · Add automated tests for critical flows
**Fixes:** ISSUE-027
**Files:** New test files throughout the project

- [ ] **27.1** Install testing dependencies for the backend:
  ```bash
  npm install --save-dev jest supertest @jest/globals mongodb-memory-server
  ```
- [ ] **27.2** Install testing dependencies for the frontend:
  ```bash
  npm install --save-dev vitest @testing-library/react @testing-library/user-event
  ```
- [ ] **27.3** Configure Jest in `backend/package.json` with `"testEnvironment": "node"` and `"transform"` for ES modules
- [ ] **27.4** Write auth flow tests (`backend/tests/auth.test.js`):
  - Login with valid credentials returns tokens
  - Login with invalid credentials returns 401
  - OTP initiation creates a session
  - OTP completion creates a user
- [ ] **27.5** Write consent access tests (`backend/tests/consent.test.js`):
  - Doctor without consent cannot access patient records (403)
  - Doctor with active consent can access records (200)
  - Doctor with expired consent is denied (403)
  - Patient can revoke consent
- [ ] **27.6** Write emergency access tests (`backend/tests/emergency.test.js`):
  - Emergency access request creates pending record
  - Admin can approve/deny request
  - Approved emergency access grants record access
  - Expired emergency access is denied
- [ ] **27.7** Write prescription number tests (`backend/tests/prescription.test.js`):
  - Concurrent prescription creates produce unique numbers
  - Numbers follow the `RX-YYYYMM-XXXX` format
- [ ] **27.8** Write frontend component tests (`frontend/src/tests/ProtectedRoute.test.jsx`):
  - Unauthenticated user is redirected to `/login`
  - User with wrong role is redirected correctly
- [ ] **27.9** Add a `test` script to the root `package.json` that runs both backend and frontend tests
- [ ] **27.10** Add test runs to the CI/CD pipeline (or document how to run locally in `SETUP.md`)

---

### TODO-028 · Use proper ObjectId comparison in shareWith()
**Fixes:** ISSUE-028
**File:** `backend/src/models/MedicalRecord.js`

- [ ] **28.1** In the `shareWith` method, replace the string comparison:
  ```js
  // Before
  const existingShare = this.sharedWith.find(
    share => share.doctor.toString() === doctorId
  );
  
  // After
  const normalizedId = new mongoose.Types.ObjectId(doctorId);
  const existingShare = this.sharedWith.find(
    share => share.doctor.equals(normalizedId)
  );
  ```
- [ ] **28.2** Apply the same fix to `revokeAccess` method
- [ ] **28.3** Test: share a record, attempt to share again with the same doctor (should update, not duplicate), then revoke and confirm the share is removed

---

### TODO-029 · Pass auth token in AdminDashboard Socket.io handshake
**Fixes:** ISSUE-029
**File:** `frontend/src/pages/admin/Dashboard.jsx`

> Note: This task depends on the outcome of TODO-001 and TODO-002. Complete those first.

- [ ] **29.1** If tokens are still in Zustand state (before TODO-001 is complete), import `useAuthStore` and pass the token:
  ```js
  const { accessToken } = useAuthStore.getState();
  socketRef.current = io(BACKEND_URL, {
    auth: { token: accessToken },
    ...
  });
  ```
- [ ] **29.2** If tokens have moved to httpOnly cookies (TODO-001 complete), request a short-lived socket token from a dedicated endpoint and use it in the handshake instead
- [ ] **29.3** Add an error handler for socket authentication failures:
  ```js
  socketRef.current.on('connect_error', (err) => {
    if (err.message === 'Unauthorized' || err.message === 'Invalid token') {
      toast.error('Session expired. Please log in again.');
      // redirect to login
    }
  });
  ```
- [ ] **29.4** Test: log out, then attempt to access the admin dashboard via URL — confirm the socket connection is rejected and the user is redirected to login

---

## Completion Checklist

### Phase 1 — Security & HIPAA (Do first, block all releases)
- [ ] TODO-001 · Remove tokens from localStorage
- [ ] TODO-002 · Authenticate Socket.io connections
- [ ] TODO-003 · Fix emergency notification status
- [ ] TODO-004 · Fix doctor name in notifications
- [ ] TODO-006 · Standardise req.user.id field
- [ ] TODO-016 · Dedicated MFA JWT secret
- [ ] TODO-022 · Rate limiting on auth endpoints

### Phase 2 — Data Integrity & Critical Logic Bugs
- [ ] TODO-005 · Fix prescription number race condition
- [ ] TODO-007 · Replace dynamic imports in MFA
- [ ] TODO-008 · Fix medications field name mismatch
- [ ] TODO-010 · Fix getSharedWithDoctor query
- [ ] TODO-011 · Cast userId in aggregation pipeline
- [ ] TODO-012 · Replace validateBeforeSave: false

### Phase 3 — Performance & Architecture
- [ ] TODO-009 · Add pagination limit cap
- [ ] TODO-013 · Remove duplicate route
- [ ] TODO-014 · Parallelise admin notifications
- [ ] TODO-015 · Merge duplicate notification blocks
- [ ] TODO-019 · Add emergency path to canUserAccess

### Phase 4 — Code Quality & Robustness
- [ ] TODO-017 · Guard localStorage JSON.parse
- [ ] TODO-018 · Replace deprecated req.connection
- [ ] TODO-020 · Replace limit * 1 coercion
- [ ] TODO-021 · Expand audit log hash
- [ ] TODO-023 · Remove console.error from store
- [ ] TODO-024 · Fix App.jsx JSX indentation
- [ ] TODO-028 · ObjectId comparison in shareWith

### Phase 5 — Scaling & Quality (Can be done in parallel)
- [ ] TODO-025 · Move OTP store to Redis
- [ ] TODO-026 · Remove emoji from SMS notifications
- [ ] TODO-027 · Add automated tests
- [ ] TODO-029 · Socket auth in dashboard handshake
