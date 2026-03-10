# CareQueue + Health-Vault — Copilot Instructions

## Project Overview

A full-stack healthcare platform combining:
- **CareQueue**: Real-time patient queue management with WebSocket live updates
- **Health-Vault**: Consent-based, encrypted medical records with audit logging

Three user roles: **Patient**, **Doctor**, **Admin**.

---

## Dev Commands

> Backend and frontend run in **separate terminals** — no root-level script combines them.

```bash
# Backend (from /backend)
npm run dev          # nodemon src/server.js — dev with auto-reload
npm start            # node src/server.js — production
npm test             # jest (with supertest)
npm run lint         # eslint src/**/*.js

# Frontend (from /frontend)
npm run dev          # Vite dev server → http://localhost:5173
npm run build        # Production bundle
npm run preview      # Preview production build
```

**First-time setup**: copy `backend/.env.example → backend/.env` and `frontend/.env.example → frontend/.env`, then fill in values before starting.

**Node 18+ required** (`engines` field enforces this).

---

## Architecture

### Stack
- **Backend**: Node.js 18 / Express / MongoDB (Mongoose) — uses **ES Modules** (`"type": "module"`), all relative imports need `.js` extensions
- **Frontend**: React 18 + Vite + Tailwind CSS / Zustand (state) / React Query + Axios (data)
- **Real-time**: Socket.io v4 on the same HTTP server; `io` is shared via `app.set('io', io)`
- **Auth**: JWT two-token pattern — access token (15 min) + refresh token (7 days); registration is two-step (initiate → OTP verify → complete)

### Key Env Vars

| Backend | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection (default: `mongodb://localhost:27017/carequeue`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing |
| `ENCRYPTION_KEY` | 32-char key for medical record encryption |
| `TWILIO_*` / `EMAIL_*` | OTP delivery (SMS + email) |

| Frontend | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base (default: `http://localhost:5000/api`) |
| `VITE_SOCKET_URL` | Socket.io server (default: `http://localhost:5000`) |

---

## File Structure Guide

```
backend/src/
  server.js            # Entry point — middleware order: helmet→compression→cors→JSON→morgan
  config/
    database.js        # Mongoose connection
    multer.js          # File upload config (disk storage → uploads/medical-records/)
  controllers/         # Request handlers (one per feature domain)
  middleware/
    auth.js            # JWT-only protect() + authorize(...roles) — does NOT hit DB
    authMiddleware.js  # protect() that hits DB on every request (used only in authRoutes.js)
    auditLogger.js     # Wraps specific admin routes; not global
  models/              # Mongoose schemas
  routes/              # Express routers registered in server.js
  services/            # Business logic (notificationService, emailService, etc.)
  utils/

frontend/src/
  App.jsx              # React Router v6 route tree with <ProtectedRoute role="...">
  store/
    useAuthStore.js    # Primary auth Zustand store — persisted to localStorage as 'auth-storage'
    notificationStore.js
  services/
    api.js             # Axios instance + auth interceptor + all API helpers
  components/          # Shared UI components
  pages/               # Route-level page components
```

---

## Key Conventions

### Backend
- **ES Modules only**: use `import`/`export`, never `require()`. Include `.js` in relative imports.
- **Route protection**: import `protect` and `authorize` from `../middleware/auth.js` (not `authMiddleware.js`) for all routes except auth.
- **Real-time events**: emit via `req.app.get('io').to('user:<id>').emit(...)` or via `notificationService`.
- **Audit logging**: use `auditLogger` middleware on admin routes that create/update/delete/change-status users.
- **File uploads**: Multer config is in `config/multer.js`. Max 5 files, 10 MB each. Stored at `uploads/medical-records/`.
- **Error handling**: controllers should `try/catch` and call `next(err)`, or return `res.status(4xx/5xx).json({ message: '...' })`.

### Frontend
- **Auth token access**: Zustand store (`useAuthStore`) is the source of truth. The Axios interceptor in `api.js` reads from `localStorage.getItem('auth-storage')` → `.state.accessToken`. **Do not change the Zustand persist key** (`auth-storage`) or the `.state` shape without updating the interceptor.
- **API calls**: use the helpers exported from `services/api.js`; avoid creating new Axios instances elsewhere.
- **State management**: Zustand for global state; React Query for server-fetched/cached data.
- **Routing**: wrap role-specific routes with `<ProtectedRoute role="patient|doctor|admin">`.

---

## Known Pitfalls

1. **Duplicate auth files**: `middleware/auth.js` (JWT-only) vs `middleware/authMiddleware.js` (DB lookup). Routes should use `auth.js` unless you need a live DB check. The extra `auth.routes.js` is **not** registered by the server — only `authRoutes.js` is.

2. **Duplicate store files**: `store/useAuthStore.js` is primary; `store/authStore.js` may be legacy. Do not add logic to `authStore.js`.

3. **Token parsing fragility**: Axios interceptor parses `JSON.parse(localStorage.getItem('auth-storage')).state.accessToken`. Changing the Zustand persist shape silently breaks all authenticated requests.

4. **Rate limiting**: configured via env (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`), but `express-rate-limit` must be explicitly applied to routes — verify coverage before adding new public endpoints.

5. **Appointment schedulers**: `node-cron` jobs start automatically on server boot (`initializeAppointmentSchedulers()`). Be aware when testing time-sensitive functionality.

6. **Medical record encryption**: `ENCRYPTION_KEY` must be exactly 32 characters. Changing this key after records are stored will make existing records unreadable.

---

## API Route Reference

| Prefix | File | Description |
|---|---|---|
| `/api/auth` | `authRoutes.js` | Register (2-step + OTP), login, refresh, forgot/reset password, `/me`, logout |
| `/api/users` | `user.routes.js` | User profile CRUD |
| `/api/appointments` | `appointment.routes.js` | Book, list, cancel appointments |
| `/api/queue` | `queue.routes.js` | Patient join/status; doctor queue, call-next, stats |
| `/api/records` | `record.routes.js` | Upload (multipart, 5 files max), list, download, share, delete records; PDF export |
| `/api/consent` | `consent.routes.js` | Grant, revoke, list consents; consent history |
| `/api/emergency-access` | `emergencyAccess.routes.js` | Doctor emergency access requests |
| `/api/prescriptions` | `prescription.routes.js` | Create, list, view prescriptions |
| `/api/audit` | `audit.routes.js` | Audit log queries (admin/compliance) |
| `/api/analytics` | `analytics.routes.js` | Dashboard analytics |
| `/api/admin` | `admin.routes.js` | User management + emergency cases (admin-only) |
| `/api/notifications` | `notification.routes.js` | List, mark-read, clear notifications |

Static files: `GET /uploads/*` → `backend/uploads/`  
Health check: `GET /health` and `GET /api/health`

---

## Data Models

`User`, `Appointment`, `Queue`, `MedicalRecord`, `Prescription`, `Consent`, `EmergencyAccess`, `AuditLog`, `Notification`
