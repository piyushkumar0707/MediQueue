# ISSUE.md — MediQueue / CareQueue Code Review

> **Project:** MediQueue (CareQueue) — Healthcare Management Platform
> **Stack:** Express.js + MongoDB (backend) · React 18 + Vite + Zustand (frontend)
> **Review Date:** 2026-03-15
> **Total Issues Found:** 29

---

## Severity Legend

| Badge | Meaning |
|-------|---------|
| 🔴 CRITICAL | Security breach, data loss, or HIPAA compliance violation |
| 🟠 HIGH | Logic error or serious functional bug causing incorrect behaviour |
| 🟡 MEDIUM | Code quality, maintainability, or minor security concern |
| 🟢 LOW | Performance, compatibility, or best-practice gap |

---

## 🔴 CRITICAL Issues (7)

---

### ISSUE-001 · Auth tokens stored in localStorage (XSS-accessible)

**Severity:** 🔴 CRITICAL
**File:** `frontend/src/store/useAuthStore.js`
**Category:** Security · HIPAA

**Description:**
`useAuthStore.js` uses Zustand's `persist` middleware and includes `accessToken` and `refreshToken` in the `partialize` list, writing both tokens directly to `localStorage`. Any Cross-Site Scripting (XSS) vulnerability anywhere in the app — including third-party libraries — can steal these tokens and gain full access to patient medical records, prescriptions, and emergency access data.

The backend already correctly sets `httpOnly` cookies (in `mfaController.js` and elsewhere). The frontend should rely entirely on those cookies and never store tokens in browser-accessible storage.

**Affected Code:**
```js
// useAuthStore.js — partialize stores tokens in localStorage
partialize: (state) => ({
  user: state.user,
  accessToken: state.accessToken,    // ❌ XSS-accessible
  refreshToken: state.refreshToken,   // ❌ XSS-accessible
  isAuthenticated: state.isAuthenticated
})
```

---

### ISSUE-002 · Socket.io room joins have no server-side authentication

**Severity:** 🔴 CRITICAL
**File:** `backend/src/server.js`
**Category:** Security

**Description:**
The `join` event handler in the Socket.io server accepts `{ userId, role }` from any connecting client and immediately adds it to the corresponding room with no token verification whatsoever. Any unauthenticated WebSocket client — or any patient who changes the emitted role in devtools — can emit `join({ role: 'admin' })` and receive real-time admin events including live user registrations, queue stats, and emergency access notifications.

**Affected Code:**
```js
// server.js
socket.on('join', (data) => {
  const { userId, role } = data;   // ❌ Trusted blindly from client
  socket.join(`user:${userId}`);
  socket.join(`role:${role}`);     // ❌ No token check — anyone can join role:admin
});
```

---

### ISSUE-003 · Emergency notification says "Access Granted" when status is "pending"

**Severity:** 🔴 CRITICAL
**File:** `backend/src/controllers/emergencyAccessController.js`
**Category:** HIPAA · Logic Bug

**Description:**
When a doctor requests emergency access, the system creates an `EmergencyAccess` record with `status: 'pending'` (requiring admin approval before access is actually allowed). However, the notification immediately sent to the patient has `title: 'Emergency Access Granted'`. This is factually incorrect — access has not been granted, it has been requested. Patients in distress or their families will believe their records were already accessed when they have not been. This is a HIPAA transparency compliance violation.

**Affected Code:**
```js
// emergencyAccessController.js
const emergencyAccess = await EmergencyAccess.create({
  status: 'pending'  // Not granted yet — requires admin approval
});

const patientNotification = await Notification.create({
  title: 'Emergency Access Granted',  // ❌ WRONG — should be "Requested"
  ...
});
```

---

### ISSUE-004 · req.user.firstName produces "Dr. undefined undefined" in all emergency notifications

**Severity:** 🔴 CRITICAL
**File:** `backend/src/controllers/emergencyAccessController.js`
**Category:** Logic Bug

**Description:**
All emergency notification messages reference `req.user.firstName` and `req.user.lastName` to identify the requesting doctor. However, the User model stores personal information nested under `personalInfo.firstName` / `personalInfo.lastName`. The `req.user` object (populated by the JWT middleware) does not have flat `firstName` / `lastName` properties. As a result, every single emergency access notification — sent to patients and all admin users — reads "Dr. undefined undefined has requested emergency access."

**Affected Code:**
```js
// emergencyAccessController.js
message: `Dr. ${req.user.firstName} ${req.user.lastName} has requested...`
//              ^^^^^^^^^^^^^^^^      ^^^^^^^^^^^^^^^^^
//              Both are undefined — correct path is req.user.personalInfo.firstName
```

---

### ISSUE-005 · Prescription number generation has a race condition

**Severity:** 🔴 CRITICAL
**File:** `backend/src/models/Prescription.js`
**Category:** Data Integrity · Concurrency

**Description:**
The `prescriptionNumber` pre-save hook uses a read-then-write pattern: it queries `findOne` for the highest existing number, increments it, then saves. Under concurrent load, two simultaneous `POST /api/prescriptions` requests will both read the same "last number," both compute the same next number, and one will fail on the unique index constraint — producing a 500 error mid-consultation. This is a TOCTOU (time-of-check/time-of-use) race condition.

**Affected Code:**
```js
// Prescription.js pre-save hook
const lastPrescription = await this.constructor
  .findOne({ prescriptionNumber: new RegExp(`^${prefix}`) })
  .sort({ prescriptionNumber: -1 });   // ❌ Non-atomic — race condition
// ... increment and save — will collision-fail under concurrency
```

---

### ISSUE-006 · Inconsistent user ID field: req.user.id vs req.user.userId

**Severity:** 🔴 CRITICAL
**File:** Multiple controllers
**Category:** Logic Bug

**Description:**
Controllers inconsistently reference the authenticated user's ID using two different property names:
- `mfaController.js` uses `req.user.id`
- `notificationController.js`, `consentController.js` use `req.user.userId`

Depending on exactly what the JWT auth middleware sets on `req.user`, one of these groups is silently receiving `undefined` as the user ID. This causes incorrect database queries (matching no documents, or matching wrong documents) without throwing any error.

**Files Affected:**
- `backend/src/controllers/mfaController.js` — uses `req.user.id`
- `backend/src/controllers/notificationController.js` — uses `req.user.userId`
- `backend/src/controllers/consentController.js` — uses `req.user.userId`
- `backend/src/middleware/auth.js` — source of truth (needs audit)

---

### ISSUE-007 · Dynamic imports inside MFA request handler on every call

**Severity:** 🔴 CRITICAL
**File:** `backend/src/controllers/mfaController.js`
**Category:** Performance · Architecture

**Description:**
The `validateMfa` handler uses `await import(...)` for `jsonwebtoken`, `../utils/jwt.js`, and `../models/AuditLog.js` inside the function body on every request. These should be static top-of-file imports. Dynamic imports bypass Node.js module caching in some environments, add async latency to a security-sensitive endpoint, and signal an architectural mistake (likely added to work around a circular dependency that should be resolved properly instead).

**Affected Code:**
```js
// mfaController.js — inside validateMfa handler
const jwt = await import('jsonwebtoken');           // ❌ Static import
const { generateTokenPair } = await import('../utils/jwt.js');  // ❌ Static import
const { default: AuditLog } = await import('../models/AuditLog.js'); // ❌ Static import
```

---

## 🟠 HIGH Issues (9)

---

### ISSUE-008 · prescription.medications vs prescription.medicines — field name mismatch

**Severity:** 🟠 HIGH
**File:** `frontend/src/pages/doctor/PatientRecords.jsx`
**Category:** Logic Bug

**Description:**
The PatientRecords component renders the medications list using `prescription.medications?.map(...)`. The Prescription Mongoose model and API response use the field name `medicines`. This mismatch causes the medications section to silently render empty for every patient record viewed by a doctor. The optional chaining `?.` hides the bug — no error is thrown.

**Affected Code:**
```jsx
// PatientRecords.jsx
{prescription.medications?.map((med, idx) => (  // ❌ Field is 'medicines' not 'medications'
```

---

### ISSUE-009 · No upper cap on pagination limit — potential DoS

**Severity:** 🟠 HIGH
**File:** Multiple backend controllers
**Category:** Security · Performance

**Description:**
Multiple controllers accept a `limit` query parameter with no maximum cap. Any authenticated user can send `?limit=999999` to retrieve the entire collection in one response, causing a massive MongoDB full-collection scan, memory spike, and slow response that can bring down the server. Affects at minimum: `getMyEmergencyRequests`, `getEmergencyAccessForReview`, and all other paginated endpoints.

**Affected Code:**
```js
// emergencyAccessController.js
const { page = 1, limit = 10 } = req.query;
// ❌ No Math.min(parseInt(limit), 100) cap
.limit(limit * 1)
```

---

### ISSUE-010 · getSharedWithDoctor $or query doesn't filter by the specific doctor's expiry

**Severity:** 🟠 HIGH
**File:** `backend/src/models/MedicalRecord.js`
**Category:** Logic Bug

**Description:**
The `getSharedWithDoctor` static method uses a top-level `$or` to filter by expiry date, but this checks whether *any* `sharedWith` entry has a null or future expiry — not specifically the requesting doctor's entry. A record shared with Doctor A (expired) and Doctor B (active) could incorrectly match for Doctor A because Doctor B's entry satisfies the `$or` clause.

**Affected Code:**
```js
// MedicalRecord.js
$or: [
  { 'sharedWith.expiresAt': null },               // ❌ Matches any sharedWith entry
  { 'sharedWith.expiresAt': { $gt: new Date() } } // ❌ Not scoped to the specific doctor
]
```

---

### ISSUE-011 · Consent stats aggregate uses string userId — no ObjectId cast

**Severity:** 🟠 HIGH
**File:** `backend/src/controllers/consentController.js`
**Category:** Logic Bug

**Description:**
In `getConsentStats`, the aggregation pipeline `$match` stage uses `patient: req.user.userId` where `req.user.userId` is a string. MongoDB aggregation pipelines do not auto-cast strings to ObjectId. The `$match` will find zero documents for every user, silently returning empty stats. The regular `Consent.countDocuments` calls above it work because Mongoose auto-casts there, but the aggregation path does not.

**Affected Code:**
```js
// consentController.js
$match: {
  patient: req.user.userId,  // ❌ String, not ObjectId — aggregation won't match
  ...
}
```

---

### ISSUE-012 · validateBeforeSave: false used broadly — bypasses all schema validation

**Severity:** 🟠 HIGH
**File:** `backend/src/controllers/mfaController.js`
**Category:** Data Integrity

**Description:**
All three MFA operations (setup, verify-setup, disable) call `user.save({ validateBeforeSave: false })`. While this is sometimes appropriate for password-related saves, using it as a blanket flag bypasses all Mongoose schema validators — required fields, enum checks, min/max length, and custom validators — allowing invalid or incomplete data to be silently written to MongoDB.

---

### ISSUE-013 · Duplicate doctor patient routes map to the same component

**Severity:** 🟠 HIGH
**File:** `frontend/src/App.jsx`
**Category:** Architecture

**Description:**
Two separate route definitions in the doctor section both render `PatientRecords`:
```jsx
<Route path="patients/:patientId/records" element={<PatientRecords />} />
<Route path="patient/:patientId" element={<PatientRecords />} />
```
This creates two canonical paths for the same page, breaks `NavLink` active state detection, confuses browser history, and will cause future navigation bugs. One should be removed and all links updated to the surviving path.

---

### ISSUE-014 · Sequential await inside admin notification loop — blocking

**Severity:** 🟠 HIGH
**File:** `backend/src/controllers/emergencyAccessController.js`
**Category:** Performance

**Description:**
Admin notifications in `requestEmergencyAccess` are sent using a `for...of` loop with `await` inside each iteration. With N admins, this performs N sequential DB inserts and N sequential notification sends. Emergencies require fast response — all admin notifications should be dispatched in parallel with `Promise.all`.

**Affected Code:**
```js
// emergencyAccessController.js
for (const admin of admins) {
  const adminNotification = await Notification.create({...});  // ❌ Sequential
  await notificationService.sendNotification(adminNotification);  // ❌ Sequential
}
```

---

### ISSUE-015 · Duplicate admin notification blocks — fragile mirror logic

**Severity:** 🟠 HIGH
**File:** `backend/src/controllers/emergencyAccessController.js`
**Category:** Code Quality

**Description:**
`requestEmergencyAccess` contains two separate admin notification blocks — one runs when `!flaggedForReview` and the other when `flaggedForReview`. This is logically exhaustive but architecturally fragile: the two blocks are nearly identical, and any future change to one will almost certainly be missed in the other. The blocks should be unified with a conditional on the notification type/title inside a single loop.

---

### ISSUE-016 · MFA session token reuses JWT_ACCESS_SECRET

**Severity:** 🟠 HIGH
**File:** `backend/src/controllers/mfaController.js`
**Category:** Security

**Description:**
The MFA session token is verified using `process.env.JWT_ACCESS_SECRET` — the same secret used to sign regular access tokens. A crafted access token with a `type: "mfa_session"` claim injected into its payload could potentially satisfy the MFA session check. MFA session tokens should be signed and verified with a dedicated separate secret (`JWT_MFA_SECRET`).

---

## 🟡 MEDIUM Issues (8)

---

### ISSUE-017 · localStorage.getItem JSON.parse without try/catch in AdminDashboard

**Severity:** 🟡 MEDIUM
**File:** `frontend/src/pages/admin/Dashboard.jsx`
**Category:** Robustness

**Description:**
The widget settings state initialiser calls `JSON.parse(localStorage.getItem('dashboardWidgets'))` bare, with no error handling. If the stored value is malformed for any reason (browser extension, storage corruption, manual edit), this throws a `SyntaxError` during component initialisation, crashing the entire AdminDashboard with an unhandled exception and a blank screen.

---

### ISSUE-018 · req.connection?.remoteAddress is deprecated and removed in Node.js v20

**Severity:** 🟡 MEDIUM
**File:** Multiple backend controllers
**Category:** Deprecation

**Description:**
Multiple controllers include `req.ip || req.connection?.remoteAddress` as a fallback for IP logging. `req.connection` was deprecated in Node.js v13.0 and fully removed in Node.js v20. On Node 20+ the fallback silently evaluates to `undefined`. The correct modern equivalent is `req.socket?.remoteAddress`, though `req.ip` (which Express always provides) should be sufficient on its own.

---

### ISSUE-019 · canUserAccess() doesn't check emergency access pathway

**Severity:** 🟡 MEDIUM
**File:** `backend/src/models/MedicalRecord.js`
**Category:** Architecture

**Description:**
The `canUserAccess` instance method checks patient ownership, admin role, uploader, and sharedWith — but does not check for an active `EmergencyAccess` record. Any future code path that calls `canUserAccess()` and relies on it as the single source of access truth will silently deny access to doctors with valid emergency access. The emergency access check must be implemented at every controller that accesses records, creating an inconsistency risk.

---

### ISSUE-020 · limit * 1 anti-pattern for type coercion

**Severity:** 🟡 MEDIUM
**File:** Multiple backend controllers
**Category:** Code Quality

**Description:**
Several controllers use `limit * 1` and `page * 1` to coerce query string values from strings to numbers. This is an obscure pattern that reads as a no-op to unfamiliar developers. If `limit` is an empty string `""`, `"" * 1` produces `0`, potentially causing `.limit(0)` which in MongoDB returns all documents. Use `parseInt(limit, 10) || 10` with an explicit fallback.

---

### ISSUE-021 · Audit log hash covers only 3 fields — provides false tamper-detection confidence

**Severity:** 🟡 MEDIUM
**File:** Multiple backend controllers
**Category:** Compliance

**Description:**
The SHA-256 hash stored in audit log entries only covers `{ userId, action, timestamp }`, not the full audit record. This gives a false impression of integrity verification — the `ipAddress`, `userAgent`, `metadata`, and `dataAccessed` fields can all be modified without invalidating the hash. The hash should either cover the full serialised audit document, or be removed if it is not actually used for verification.

---

### ISSUE-022 · No stricter rate limiting on critical auth endpoints

**Severity:** 🟡 MEDIUM
**File:** `backend/src/routes/authRoutes.js`
**Category:** Security

**Description:**
While general middleware rate limiting is referenced in the architecture documentation, no dedicated stricter limits are applied to the highest-risk endpoints: `/auth/login`, `/auth/forgot-password`, and `/auth/mfa/validate`. These are the primary targets for credential stuffing and brute-force attacks. Each should have its own express-rate-limit instance with a low threshold (e.g., 5 attempts per 15 minutes per IP).

---

### ISSUE-023 · console.error in production auth store leaks internal error structure

**Severity:** 🟡 MEDIUM
**File:** `frontend/src/store/useAuthStore.js`
**Category:** Security

**Description:**
`initiateRegistration` calls `console.error('API call error:', error)` directly. In production builds, this exposes the full Axios error object — including request headers, response body, and stack traces — to the browser console. This is visible to any user who opens devtools and could expose internal API error messages or response structures.

**Affected Code:**
```js
// useAuthStore.js
} catch (error) {
  console.error('API call error:', error);  // ❌ Remove from production code
```

---

### ISSUE-024 · Toaster inconsistent JSX placement in App.jsx

**Severity:** 🟡 MEDIUM
**File:** `frontend/src/App.jsx`
**Category:** Code Quality

**Description:**
`<Toaster>` is a sibling of `<Routes>` inside `<Router>`, but the indentation in the source file makes it visually appear to sit between `<Router>` and `<Routes>`, while `</Router>` is actually below `</Routes>`. This misleading nesting is a readability and maintenance issue indicating inconsistent code formatting discipline.

---

## 🟢 LOW Issues (5)

---

### ISSUE-025 · In-memory OTP store won't survive server restarts or horizontal scaling

**Severity:** 🟢 LOW
**File:** `backend/src/utils/otpStore.js`
**Category:** Scalability

**Description:**
If `otpStore.js` uses an in-memory Map or plain object (a common pattern), all pending OTPs are lost on every server restart or crash. In a multi-process or horizontally-scaled deployment, OTPs generated by one process are not visible to others. Redis is already configured in the project — all OTP state should be stored in Redis with an appropriate TTL.

---

### ISSUE-026 · Emoji in notification titles — SMS/email delivery risk

**Severity:** 🟢 LOW
**File:** `backend/src/controllers/emergencyAccessController.js`, `consentController.js`
**Category:** Compatibility

**Description:**
Notification titles are hardcoded with emoji characters (e.g., `'🚨 New Emergency Access Request'`, `'🚫 Consent Revoked'`). Some SMS gateway providers and older email clients either strip emoji characters or replace them with garbled output. For critical emergency notifications, this could result in unreadable messages reaching patients or admins.

---

### ISSUE-027 · No automated tests present in the entire codebase

**Severity:** 🟢 LOW
**File:** Entire project
**Category:** Testing

**Description:**
The project contains zero unit, integration, or end-to-end test files. For a HIPAA-relevant healthcare application handling medical records, prescriptions, emergency access overrides, and consent management, the absence of any automated testing is a significant operational risk. Any refactor or dependency upgrade could silently break critical flows with no safety net.

**Minimum coverage needed:**
- Auth flows (login, OTP, MFA, token refresh)
- Consent check logic (access granted/denied/emergency)
- Emergency access creation and status transitions
- Prescription creation and number generation

---

### ISSUE-028 · shareWith() uses fragile string comparison for ObjectId check

**Severity:** 🟢 LOW
**File:** `backend/src/models/MedicalRecord.js`
**Category:** Code Quality

**Description:**
The existing share deduplication check in `shareWith()` uses `share.doctor.toString() === doctorId` where `doctorId` may be a string or an ObjectId depending on the call site. While this usually works because `.toString()` on an ObjectId returns the hex string, it's an implicit coupling. Using `new mongoose.Types.ObjectId(doctorId).equals(share.doctor)` makes the intent explicit and handles both types correctly.

---

### ISSUE-029 · Admin Dashboard Socket.io connects without auth token in handshake

**Severity:** 🟢 LOW
**File:** `frontend/src/pages/admin/Dashboard.jsx`
**Category:** Security

**Description:**
The Socket.io client connection in `AdminDashboard.jsx` does not include any authentication token in the connection handshake options. Combined with ISSUE-002 (no server-side socket room auth), there is currently no mechanism whatsoever to verify that a connecting WebSocket client is an authenticated admin user.

**Affected Code:**
```js
// AdminDashboard.jsx
socketRef.current = io(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  // ❌ No auth: { token: accessToken } in the handshake
});
```

---

## Summary Table

| ID | Title | Severity | Area |
|----|-------|----------|------|
| ISSUE-001 | Tokens stored in localStorage | 🔴 CRITICAL | Frontend / Security |
| ISSUE-002 | Socket.io rooms unauthenticated | 🔴 CRITICAL | Backend / Security |
| ISSUE-003 | Emergency notification wrong status | 🔴 CRITICAL | Backend / HIPAA |
| ISSUE-004 | req.user.firstName is undefined | 🔴 CRITICAL | Backend / Logic Bug |
| ISSUE-005 | Prescription number race condition | 🔴 CRITICAL | Backend / Data Integrity |
| ISSUE-006 | req.user.id vs req.user.userId | 🔴 CRITICAL | Backend / Logic Bug |
| ISSUE-007 | Dynamic imports in MFA handler | 🔴 CRITICAL | Backend / Architecture |
| ISSUE-008 | medications vs medicines field mismatch | 🟠 HIGH | Frontend / Logic Bug |
| ISSUE-009 | No pagination limit cap | 🟠 HIGH | Backend / Security |
| ISSUE-010 | getSharedWithDoctor $or query bug | 🟠 HIGH | Backend / Logic Bug |
| ISSUE-011 | Consent stats aggregate ObjectId cast | 🟠 HIGH | Backend / Logic Bug |
| ISSUE-012 | validateBeforeSave: false overused | 🟠 HIGH | Backend / Data Integrity |
| ISSUE-013 | Duplicate doctor patient routes | 🟠 HIGH | Frontend / Architecture |
| ISSUE-014 | Sequential await in admin notif loop | 🟠 HIGH | Backend / Performance |
| ISSUE-015 | Duplicate admin notification blocks | 🟠 HIGH | Backend / Code Quality |
| ISSUE-016 | MFA reuses JWT_ACCESS_SECRET | 🟠 HIGH | Backend / Security |
| ISSUE-017 | localStorage JSON.parse no try/catch | 🟡 MEDIUM | Frontend / Robustness |
| ISSUE-018 | req.connection deprecated Node v20 | 🟡 MEDIUM | Backend / Deprecation |
| ISSUE-019 | canUserAccess() missing emergency path | 🟡 MEDIUM | Backend / Architecture |
| ISSUE-020 | limit * 1 coercion anti-pattern | 🟡 MEDIUM | Backend / Code Quality |
| ISSUE-021 | Audit hash covers only 3 fields | 🟡 MEDIUM | Backend / Compliance |
| ISSUE-022 | No rate limit on auth endpoints | 🟡 MEDIUM | Backend / Security |
| ISSUE-023 | console.error in production store | 🟡 MEDIUM | Frontend / Security |
| ISSUE-024 | Toaster JSX placement inconsistency | 🟡 MEDIUM | Frontend / Code Quality |
| ISSUE-025 | In-memory OTP store not scalable | 🟢 LOW | Backend / Scalability |
| ISSUE-026 | Emoji in notification titles | 🟢 LOW | Backend / Compatibility |
| ISSUE-027 | No automated tests | 🟢 LOW | Both / Testing |
| ISSUE-028 | shareWith fragile ObjectId comparison | 🟢 LOW | Backend / Code Quality |
| ISSUE-029 | Dashboard socket no auth in handshake | 🟢 LOW | Frontend / Security |
