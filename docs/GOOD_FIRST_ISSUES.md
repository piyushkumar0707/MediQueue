# Good First Issues

A curated list of realistic starter tasks based on gaps found in the actual codebase. Each entry has everything you need to open it as a GitHub issue.

> **To create these issues** (once the repo is public):
> ```bash
> gh issue create --title "..." --body "..." --label "good first issue,..."
> ```

---

## 1. Unit tests for `notificationController` — zero coverage

**Title:** `test: add unit tests for notificationController`

**Description:**
`backend/src/controllers/notificationController.js` handles creating notifications, marking them read, and deleting them, but has **no unit tests**. The integration test suite covers auth and consent flows, but `notificationController` is not exercised at all. Add Jest unit tests covering at minimum: `createNotification` (happy path + missing `recipient`), `getNotifications` (pagination params), and `markAsRead` (owned vs. foreign notification).

**Files involved:**
- `backend/src/controllers/notificationController.js`
- `backend/tests/` (create `backend/tests/unit/notification.controller.test.js`)
- `backend/tests/helpers/` (use existing helpers for env/mongoose stubs)

**Suggested labels:** `good first issue`, `test`, `backend`

---

## 2. Unit tests for `encryption.service` — the most critical untested module

**Title:** `test: add unit tests for encryption.service.js`

**Description:**
`backend/src/services/encryption.service.js` implements AES-256-GCM record encryption and key wrapping (`generateEncryptionKey`, `wrapKey`, `unwrapKey`). It is the most security-critical module in the codebase and has no dedicated tests. Add unit tests verifying:
- `generateEncryptionKey()` returns a buffer of the expected length
- A `wrapKey` → `unwrapKey` round-trip returns the original key
- Decrypting with a wrong key throws or returns a predictable error

No database or Redis required — pure unit tests.

**Files involved:**
- `backend/src/services/encryption.service.js`
- `backend/tests/` (create `backend/tests/unit/encryption.service.test.js`)

**Suggested labels:** `good first issue`, `test`, `backend`, `security`

---

## 3. Input validation missing on `POST /api/v1/appointments`

**Title:** `fix: add express-validator rules to bookAppointment route`

**Description:**
`POST /api/v1/appointments` (handled by `bookAppointment` in `appointmentController.js`) accepts `doctorId`, `appointmentDate`, `timeSlot`, `reasonForVisit`, and `type` from `req.body` but there is **no `express-validator` schema applied** on the route — unlike auth and consent routes which use `validators.js` + the `validate` middleware. Without validation, malformed `doctorId` (non-Mongo-ID) reaches `User.findById()` and throws an unhandled cast error. Add a `validateBookAppointment` rule set in `validators.js` and wire it into `appointment.routes.js`.

**Files involved:**
- `backend/src/middleware/validators.js` — add `validateBookAppointment`
- `backend/src/routes/appointment.routes.js` — import and apply the validator + `validate` middleware
- `backend/src/middleware/validate.js` — already exists, just use it

**Suggested labels:** `good first issue`, `fix`, `backend`, `validation`

---

## 4. Input validation missing on `POST /api/v1/notifications`

**Title:** `fix: add express-validator rules to createNotification route`

**Description:**
`POST /api/v1/notifications` (handled by `createNotification`) accepts `recipient`, `type`, `title`, `message`, and `priority` without any request validation layer. `recipient` is used as a Mongoose ObjectId without prior shape-checking, and `priority` is not validated against the allowed values (`low`, `medium`, `high`, `critical`) before the DB call. Add a `validateCreateNotification` rule set in `validators.js` and apply it to the notification route.

**Files involved:**
- `backend/src/middleware/validators.js` — add `validateCreateNotification`
- `backend/src/routes/notification.routes.js`
- `backend/src/models/Notification.js` — reference for allowed `priority` and `type` enum values

**Suggested labels:** `good first issue`, `fix`, `backend`, `validation`

---

## 5. README is missing screenshot / UI walkthrough

**Title:** `docs: add annotated screenshots to README`

**Description:**
The README has architecture and ER diagrams but no UI screenshots showing the Patient queue dashboard, the Health-Vault record list, or the Admin audit log explorer. Screenshots make the project significantly easier to evaluate for contributors and give the OpenAI Codex application stronger visual evidence of working features. Add 3–5 annotated screenshots to `docs/images/screens/` and embed them in a new `## Screenshots` section in README between the Feature Breakdown and Architecture sections.

**Files involved:**
- `README.md` — add `## Screenshots` section
- `docs/images/screens/` — create directory, add PNG screenshots (use the live demo at https://medi-queue-ten.vercel.app)

**Suggested labels:** `good first issue`, `documentation`

---

## 6. No JSDoc on public utility functions

**Title:** `docs: add JSDoc to backend utility functions`

**Description:**
`backend/src/utils/` contains several shared utilities (`parsePagination`, `createRateLimiter`, `getCachedUser`, `invalidateUserCache`, `signAccessToken`, `verifyAccessToken`) that are used across many controllers but have no JSDoc comments. This makes IDE autocomplete and contributor onboarding harder. Add `@param` and `@returns` JSDoc to each exported function. No logic changes.

**Files involved:**
- `backend/src/utils/pagination.js`
- `backend/src/utils/rateLimiter.js`
- `backend/src/utils/userCache.js`
- `backend/src/utils/jwt.js`

**Suggested labels:** `good first issue`, `documentation`, `backend`

---

## 7. Pagination params not validated — negative `limit` reaches MongoDB

**Title:** `fix: validate pagination query params in parsePagination`

**Description:**
`backend/src/utils/pagination.js` `parsePagination(query, defaultLimit)` uses `parseInt(query.limit)` and `parseInt(query.page)` but does not clamp or reject non-positive values. A request with `?limit=-1` or `?page=0` produces a MongoDB query with a negative limit or a page offset of 0/−1, which either errors or returns confusing results. Add clamping: `page = Math.max(1, page)`, `limit = Math.min(Math.max(1, limit), 100)`. Update the unit test file if one exists, or add one.

**Files involved:**
- `backend/src/utils/pagination.js`
- Any controller that calls `parsePagination` (no changes needed there — fix is in the utility)

**Suggested labels:** `good first issue`, `fix`, `backend`

---

## 8. Postman collection not documented in README

**Title:** `docs: document the Postman collection in README and add import instructions`

**Description:**
`CareQueue-API-Complete.postman_collection.json` exists in the repo root but is not mentioned anywhere in the README or in any docs page. Contributors and evaluators have no way to discover it. Add a short `## API Testing with Postman` section to the README explaining how to import the collection, configure the `baseUrl` environment variable, and use the `POST /auth/initiate-registration` → `POST /auth/complete-registration` → `POST /auth/login` flow to get a token. Also note that the `Authorization: Bearer {{token}}` header is pre-configured in the collection.

**Files involved:**
- `README.md` — add `## API Testing with Postman` section
- `CareQueue-API-Complete.postman_collection.json` — no changes, just reference it

**Suggested labels:** `good first issue`, `documentation`

