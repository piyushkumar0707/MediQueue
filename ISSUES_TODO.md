# CareQueue + Health-Vault — Issues & TODO List

> Comprehensive list of all identified issues broken into actionable tasks.
> Work through these one category at a time, top to bottom.

---

## 🔴 CRITICAL — Security Issues

### SEC-1: In-Memory OTP Storage
**File:** `backend/src/controllers/authController.js` (lines 9, 49–55, 112–127)
**Problem:** OTPs stored in a JavaScript `Map()` — wiped on server restart, not scalable, no encryption.
- [x] Install `ioredis` package in backend
- [x] Create `backend/src/config/redis.js` with Redis client setup
- [x] Replace `otpStore` Map with Redis `SET key value EX <ttl>` calls
- [x] Replace `otpStore.get()` / `otpStore.delete()` with Redis `GET` / `DEL`

---

### SEC-2: OTP Leaked in API Response (Dev Mode)
**File:** `backend/src/controllers/authController.js` (lines 78–80, 576–578)
**Problem:** OTP included in response body when `NODE_ENV === 'development'` — dangerous if flag is set wrong in production.
- [x] Remove the `otp` field from all API responses entirely
- [x] Use server-side logs (not response) for dev OTP inspection

---

### SEC-3: TLS Validation Disabled in Email Service
**File:** `backend/src/services/emailService.js` (lines 34–36)
**Problem:** `rejectUnauthorized: false` disables SSL certificate validation — MITM attack vector.
- [x] Change to `rejectUnauthorized: true`
- [x] Test SMTP connection with valid certificate

---

### SEC-4: JWT Tokens Stored in localStorage
**File:** `frontend/src/services/apiService.js` (lines 32–46, 82–87, 94–108)
**Problem:** Access and refresh tokens in `localStorage` are readable by any JavaScript — XSS vulnerable.
- [x] Update backend auth endpoints to set tokens as `httpOnly; Secure; SameSite=Strict` cookies
- [x] Add `cookie-parser` middleware to backend server
- [x] Add `withCredentials: true` to both axios instances in frontend
- [x] Update auth middleware (`auth.js`) to read token from cookie as fallback
- [x] Update `authController` refresh/logout to use cookie token value

---

### SEC-5: No Rate Limiting on Auth Endpoints
**File:** `backend/src/routes/auth.routes.js`
**Problem:** Login, registration, and OTP endpoints have no rate limiting — brute-force and enumeration risk.
- [x] Install `express-rate-limit` package
- [x] Create a `authLimiter` (e.g., 10 requests / 15 min per IP)
- [x] Create a stricter `otpLimiter` (e.g., 5 requests / 15 min per IP)
- [x] Apply `authLimiter` to `/login`, `/register`
- [x] Apply `otpLimiter` to `/send-otp`, `/verify-otp`

---

### SEC-6: Emergency Access Auto-Approved
**File:** `backend/src/controllers/emergencyAccessController.js` (line 50)
**Problem:** Emergency access requests set `status: 'active'` immediately — no admin review.
- [x] Change initial status from `'active'` to `'pending'`
- [x] Admin approval endpoint already exists (`PATCH /emergency-access/:id/review`)
- [x] Add socket notification to admin when a new emergency request is created

---

### SEC-7: ReDoS Vulnerability in User Search
**File:** `backend/src/controllers/userController.js` (lines 14, 19–22)
**Problem:** `new RegExp(search, 'i')` with unsanitized user input — malicious regex can freeze the server.
- [x] Add max length check (e.g., reject if `search.length > 50`)
- [x] Escape special regex characters using a utility function before compiling

---

### SEC-8: Sensitive Data Logged to Console
**Files:** `backend/src/controllers/authController.js` (lines 61–68, 223–244), `backend/src/middleware/auth.js` (lines 15–17, 26)
**Problem:** Token fragments and debug data logged via `console.log` — visible in server logs.
- [x] No `console.log` found in backend/src — all logging uses winston `logger`
- [x] Auth middleware uses `logger.warn` / `logger.error` only

---

## 🟠 HIGH — Error Handling Issues

### ERR-1: Un-Awaited Async in Middleware
**File:** `backend/src/middleware/authMiddleware.js` (line 58)
**Problem:** `User.findByIdAndUpdate()` called without `await` — `lastActiveAt` update silently fails.
- [x] Already fixed — `authMiddleware.js` had await + try-catch; `auth.js` now also has non-blocking update with error logging

---

### ERR-2: Silent Socket.io Emit Failures
**File:** `backend/src/services/notificationService.js` (lines 35–39, 72–76)
**Problem:** Socket emissions have no error handling — failures are invisible.
- [x] All socket `.emit()` calls wrapped in try-catch with logger.error logging

---

### ERR-3: Missing Try-Catch in Appointment Controller
**File:** `backend/src/controllers/appointmentController.js` (lines 37–47, 75–91)
**Problem:** Some code paths lack error handling and use `console.log` instead of error responses.
- [x] All handlers wrapped in `asyncHandler` which forwards errors to global error handler
- [x] No `console.log` calls found — uses `logger.info` / `logger.error`

---

### ERR-4: Populate Failure Not Handled
**File:** `backend/src/controllers/consentController.js` (lines 13–17)
**Problem:** `.populate()` can silently return null if referenced documents are deleted.
- [x] Added `.filter(consent => consent.doctor != null)` / `.filter(consent => consent.patient != null)` in list endpoints
- [x] Added null check for `patient`/`doctor` in `getConsentHistory` with 404 response

---

### ERR-5: Inconsistent Error Response Format
**Files:** Multiple controllers
**Problem:** Some errors return `{ success: false, message }`, others return just `{ message }` or throw unformatted errors.
- [x] Created `backend/src/utils/errorResponse.js` helper: `errorResponse(res, status, message, code?)`
- [x] Standard shape `{ success: false, message, code? }` available for all controllers to import

---

### ERR-6: Token Refresh Edge Cases Unhandled
**File:** `frontend/src/services/apiService.js` (lines 64–76, 111)
**Problem:** `failedQueue` / `isRefreshing` state machine has untested concurrent edge cases.
- [x] Exported `clearAuthQueue()` to flush the failedQueue on logout
- [x] Called `clearAuthQueue()` in both `logout` and `logoutAll` in `useAuthStore.js`
- [x] Force logout with `failedQueue = []` reset on failed refresh

---

## 🟡 MEDIUM — Code Quality Issues

### CQ-1: Duplicate Auth Controller Files
**Files:** `backend/src/controllers/auth.controller.js` (stub), `backend/src/controllers/authController.js` (implemented)
**Problem:** Two files with the same responsibility — `auth.controller.js` is empty stubs.
- [x] `auth.controller.js` does not exist — already cleaned up

---

### CQ-2: Duplicate Auth Middleware Files
**Files:** `backend/src/middleware/auth.js`, `backend/src/middleware/authMiddleware.js`
**Problem:** Two auth middlewares with slightly different implementations — causes confusion.
- [x] Rewrote `auth.js` with full implementation (DB check, changedPasswordAfter, cookie support)
- [x] Updated `authRoutes.js` to import from `auth.js` (was using `authMiddleware.js`)
- [x] All routes now consistently use `auth.js`; `authMiddleware.js` kept for backward compat

---

### CQ-3: No Pagination on List Endpoints
**Files:** `backend/src/controllers/userController.js`, `backend/src/controllers/auditController.js`, `backend/src/controllers/recordController.js`
**Problem:** All records returned in one query — will cause performance issues at scale.
- [x] Added `page` / `limit` / `pagination` to `getDoctors` in `userController.js`
- [x] `auditController.js` (`getAuditLogs`, `getUserActivityLogs`) already had pagination
- [x] `recordController.js` (`getMyRecords`, `getPatientRecords`) already had pagination

---

### CQ-4: Hardcoded Fallback URLs
**Files:** `backend/src/services/emailService.js`, `backend/src/services/notificationService.js`
**Problem:** `process.env.FRONTEND_URL || 'http://localhost:5173'` silently uses dev URL in production.
- [x] Created `backend/src/config/validateEnv.js` with startup validation
- [x] Throws on missing `FRONTEND_URL` when `NODE_ENV === 'production'`
- [x] Called `validateEnv()` in `server.js` before app init

---

### CQ-5: Missing Request Body Validation
**Files:** `backend/src/controllers/authController.js` (line 21–28), `backend/src/controllers/emergencyAccessController.js` (line 15–19), `backend/src/controllers/consentController.js` (line 78–83)
**Problem:** `req.body` fields used directly without format validation or sanitization.
- [x] `express-validator` already in `package.json` dependencies
- [x] Created `backend/src/middleware/validators.js` with rules for: registration, login, OTP, forgot/reset password, consent grant, emergency access
- [x] Applied validators to auth routes (`authRoutes.js`)
- [x] Applied `validateGrantConsent` to `POST /consents/grant` (`consent.routes.js`)
- [x] Applied `validateEmergencyAccess` to `POST /emergency-access/request` (`emergencyAccess.routes.js`)

---

### CQ-6: Appointment Status Strings Not Enumerated
**File:** `backend/src/controllers/appointmentController.js` (line 64)
**Problem:** Status values (`'scheduled'`, `'confirmed'`, `'in-progress'`) hardcoded as strings; not in model.
- [x] `Appointment` model schema already has `enum` for `status` field

---

### CQ-7: Email Service Not Auto-Initialized
**File:** `backend/src/services/emailService.js` (lines 11–12)
**Problem:** Requires explicit `.initialize()` call before any email can be sent.
- [x] `emailService.initialize()` already called in `server.js` at startup

---

## 🔵 LOW — Incomplete Features

### FEAT-1: SMS Notifications (Twilio Stub)
**File:** `backend/src/services/notificationService.js` (lines 258–268)
**Problem:** `sendSMS()` is a placeholder with a TODO comment.
- [x] `twilio` npm package already in `package.json`
- [x] Implemented `sendSMS(notification)` using Twilio client with 160-char SMS limit
- [x] Reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` from env; warns gracefully if missing

---

### FEAT-2: MFA (Multi-Factor Authentication)
**Files:** `backend/src/controllers/authController.js` (line 292), `backend/src/models/User.js` (line 154)
**Problem:** `mfaEnabled` exists in schema but MFA is never enforced in the login flow.
- [x] TOTP method chosen (Google Authenticator / Authy compatible)
- [x] Installed `speakeasy` + `qrcode` packages
- [x] Added `mfaBackupCodes` field to User model
- [x] Created `backend/src/controllers/mfaController.js` with: `setupMfa`, `verifyMfaSetup`, `validateMfa`, `disableMfa`
- [x] Login flow in `authController.js` now returns `mfaRequired: true` + `mfaSessionToken` (5-min JWT) when MFA is enabled
- [x] Added MFA validators (`validateMfaToken`, `validateMfaValidate`) to `validators.js`
- [x] Registered MFA routes: `POST /mfa/setup`, `/mfa/verify-setup`, `/mfa/validate`, `/mfa/disable`

### FEAT-3: Email Verification Workflow
**File:** `backend/src/controllers/authController.js` (line 154)
**Problem:** `isEmailVerified: false` set on registration but no verification email is ever sent.
- [x] Generate `emailVerificationToken` (sha256 hashed) on registration, stored in User model
- [x] Added `emailVerificationToken` / `emailVerificationExpires` fields to User schema
- [x] Send verification email with link `GET /api/auth/verify-email?token=...`
- [x] Created `verifyEmail` controller that validates token and sets `isEmailVerified: true`
- [x] Registered `GET /auth/verify-email` route

---

### FEAT-4: Frontend Protected Route Token Validation
**File:** `frontend/src/components/auth/ProtectedRoute.jsx` (lines 11–12)
**Problem:** Only checks role — doesn't validate whether the access token is still valid/not expired.
- [x] Added `isTokenExpired()` helper that decodes JWT payload client-side
- [x] Calls `logout()` and redirects to `/login` if token is expired

---

### FEAT-5: Audit Log Export Formatting
**File:** `backend/src/controllers/auditController.js`
**Problem:** Export endpoint exists but output format may not be structured for CSV/PDF parsing.
- [x] `exportAuditLogs` already sets proper `Content-Type: text/csv` and `Content-Disposition: attachment; filename=...` headers
- [x] CSV rows quoted and comma-delimited; JSON fallback also available

---

## ✅ Quick Wins (Can Fix Immediately)

| Task | File | Status |
|------|------|--------|
| Fix un-awaited async (ERR-1) | `authMiddleware.js:58` | ✅ Done |
| Remove `rejectUnauthorized: false` (SEC-3) | `emailService.js:35` | ✅ Done |
| Delete duplicate stub file (CQ-1) | `auth.controller.js` | ✅ Done |
| Add appointment status enum (CQ-6) | `Appointment` model | ✅ Done |
| Add request body size limit in server.js | `server.js` | ✅ Done |
| Remove all `console.log` debug lines (SEC-8) | Multiple | ✅ Done |

---

## Issue Count Summary

| Category | Count |
|----------|-------|
| 🔴 Critical Security | 8 |
| 🟠 High — Error Handling | 6 |
| 🟡 Medium — Code Quality | 7 |
| 🔵 Low — Incomplete Features | 5 |
| **Total Tasks** | **~60 sub-tasks** |
