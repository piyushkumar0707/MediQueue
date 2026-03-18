<div align="center">

# MediQueue — CareQueue + Health-Vault

### A production-grade healthcare operations platform built with security and real-time UX at its core.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com)
[![Redis](https://img.shields.io/badge/Redis-ioredis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4-010101?style=flat-square&logo=socket.io)](https://socket.io)
[![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20OTP-orange?style=flat-square)](https://jwt.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

![Architecture Overview](architecture%20diagram%20mediqueue.png)

---

## What is this?

MediQueue solves two real-world healthcare problems in a single platform:

- **CareQueue** — eliminates physical waiting rooms with a real-time digital queue. Patients join remotely, track their position live, and get notified when it's their turn.
- **Health-Vault** — gives patients full ownership of their medical records with consent-based sharing, AES-256-GCM encryption at rest, and an immutable audit trail for every access.

Three user roles — **Patient**, **Doctor**, **Admin** — each with their own dashboard, workflows, and permission boundary.

---

## Technical Highlights

| Concern | Solution |
|---|---|
| Real-time queue updates | Socket.io v4 rooms (`user:<id>`) — server pushes diffs on every queue state change |
| Medical record security | AES-256-GCM encryption via a dedicated service; key separate from data |
| Authentication | Two-token JWT (15 min access + 7 day refresh) with a two-step OTP registration flow; tokens kept in memory only — never written to localStorage |
| MFA | TOTP via speakeasy + backup codes; separate JWT_MFA_SECRET for MFA session tokens |
| Authorization | Stateless `protect()` + `authorize(...roles)` middleware; Redis-cached user lookup (60s TTL) to avoid DB hit on every request |
| Rate limiting | Redis-backed `createRateLimiter()` factory — per-user limits effective across multiple processes |
| Audit compliance | Immutable `AuditLog` model with SHA-256 integrity hashes; middleware wraps every sensitive admin action |
| Emergency access | Doctors can request override access; all overrides are logged and surfaced to admins for review |
| File uploads | Multer → Cloudinary storage; files served via authenticated backend proxy — raw CDN URLs never exposed to clients |
| AI triage | Groq LLaMA 3.1 suggests priority from symptoms — human override always preserved, AI is advisory only |
| AI summarization | On-demand PDF text extraction + LLaMA summary — quota-limited, PII-stripped before Groq sees any text |
| AI image analysis | Groq LLaMA 4 Scout (multimodal) reads consultation note images — confidence scoring flags unclear handwriting |
| Production hardening | Helmet CSP `default-src 'none'`, CORS origin allowlist, 5xx message masking, SIGTERM/SIGINT graceful shutdown, Winston stdout-only in production |

---

## Feature Breakdown

### Patient
- Register with email/SMS OTP verification (two-step flow)
- Book appointments and join a live queue remotely
- Real-time queue position tracking with estimated wait time
- Upload, view, and delete medical records (encrypted)
- Grant / revoke per-doctor consent to individual records
- View prescriptions from completed consultations
- In-app notification centre with real-time push

![Queue Flow](queue%20flow.png)

![Health-Vault Flow](health-valut%20flow.png)

### Doctor
- Live queue dashboard — call next patient, manage consultation flow
- Access patient records (consent-gated or emergency override with justification)
- Write and manage prescriptions
- View shared records and appointment history
- Receive real-time notifications for queue events

### Admin
- Full user management (create, suspend, promote, delete)
- Analytics dashboard — appointments, queue throughput, system usage
- Audit log explorer with filtering (who accessed what, when, why)
- Emergency access review — approve / reject doctor override requests
- Real-time system activity monitoring

---

## Architecture

![System Architecture Component View](system%20arch%20comp%20view.png)

![Event Flow Diagram](event-flow%20diagram%20mediqueue.png)

### Data Model

![Database ER Diagram](database%20ER%20diagram%20mediqueue.png)

### Key Design Decisions

- **ES Modules** throughout the backend (`"type": "module"`) — native `import`/`export`, all relative imports require `.js` extensions.
- **API versioning** — all routes mounted at `/api/v1/`; health check available at `/health`, `/api/health`, and `/api/v1/health`.
- **Redis-backed caching & rate limiting** — `ioredis` with `lazyConnect: true`; user auth cache (60s TTL), analytics cache (5 min TTL), all rate limiters share the same Redis instance.
- **Stateless auth** — `protect()` middleware verifies the JWT then calls `getCachedUser()` (Redis → DB fallback); no full DB hit on hot paths.
- **`io` shared via `app.set('io', io)`** — controllers emit real-time events without coupling to the Socket layer.
- **Tokens in memory only** — access tokens live in a module-level variable inside `api.js` (Axios interceptor). The Zustand `auth-storage` persists only non-sensitive user info (name, role, avatar) — never tokens.
- **File proxy** — `GET /api/v1/records/:id/view-file` fetches the file from Cloudinary server-side and streams it to the client with `Content-Type: application/pdf` and `Content-Disposition: inline`. The raw Cloudinary URL is never given to the browser.

---

## API Surface

| Prefix | Responsibility |
|---|---|
| `POST /api/v1/auth` | Register (OTP 2-step), login, MFA, refresh token, forgot/reset password |
| `GET/PUT /api/v1/users` | Profile management |
| `GET/POST/DELETE /api/v1/appointments` | Booking lifecycle; available slots |
| `GET/POST /api/v1/queue` | Join queue, call-next, queue stats |
| `POST /api/v1/queue/triage` | AI symptom triage — advisory suggestion only, never sets priority automatically |
| `GET/POST/DELETE /api/v1/records` | Encrypted file upload, list, download, share, PDF export |
| `POST /api/v1/records/:id/summarize` | On-demand AI summary of a text-based PDF or image record |
| `GET /api/v1/records/:id/view-file` | Stream file bytes through the backend with correct Content-Type |
| `GET/POST/DELETE /api/v1/consent` | Grant, revoke, and query consent grants |
| `GET/POST /api/v1/emergency-access` | Doctor override requests + admin review |
| `GET/POST /api/v1/prescriptions` | Create and view prescriptions |
| `GET /api/v1/audit` | Tamper-evident audit log queries (admin) |
| `GET /api/v1/analytics` | Dashboard metrics (Redis-cached 5 min) |
| `GET/POST/PUT/DELETE /api/v1/admin` | User and emergency case management |
| `GET/POST /api/v1/notifications` | Real-time notification inbox |

---

## Tech Stack

**Backend:** Node.js 18 · Express · MongoDB (Mongoose) · Redis (ioredis) · Socket.io v4 · JWT · bcrypt · Multer · Cloudinary · Winston · node-cron · Nodemailer · Twilio

**Frontend:** React 18 · Vite · Tailwind CSS · Zustand · React Query · Axios · Socket.io-client · React Router v6

**Security:** AES-256-GCM (medical records) · JWT dual-token + MFA (TOTP) · OTP via SMS + email · RBAC · Helmet (`default-src 'none'`) · Redis rate limiting · Immutable audit log · CORS origin allowlist

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Redis (local or cloud — e.g. Upstash, Railway)
- npm

### Setup

```bash
# 1. Clone
git clone https://github.com/piyushkumar0707/MediQueue.git
cd MediQueue

# 2. Backend
cd backend
cp .env.example .env        # fill in all required vars (see table below)
npm install
npm run dev                 # → http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env        # set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev                 # → http://localhost:5173
```

### Environment Variables (Backend)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `REDIS_URL` | ✅ | Redis connection string (e.g. `redis://localhost:6379`) |
| `JWT_ACCESS_SECRET` | ✅ | Sign access tokens (15 min) |
| `JWT_REFRESH_SECRET` | ✅ | Sign refresh tokens (7 days) |
| `JWT_MFA_SECRET` | ✅ | Sign MFA session tokens |
| `ENCRYPTION_KEY` | ✅ | Exactly 32 characters — AES-256 key for medical records |
| `FRONTEND_URL` | ✅ (prod) | Allowed CORS origin(s) — comma-separated for multi-env |
| `TWILIO_*` | ✅ | SMS OTP delivery |
| `EMAIL_*` | ✅ | Email OTP delivery |
| `CLOUDINARY_*` | ✅ | File storage |
| `GROQ_API_KEY` | optional | Groq LLaMA API key — get free at [console.groq.com](https://console.groq.com). If omitted, AI features return `503` and the app starts normally |
| `AI_FEATURE_TRIAGE` | optional | `true`/`false` — toggle symptom triage without redeploy (default: `true`) |
| `AI_FEATURE_SUMMARIZE` | optional | `true`/`false` — toggle record summarization without redeploy (default: `true`) |
| `AI_FEATURE_IMAGE_ANALYSIS` | optional | `true`/`false` — toggle image analysis independently (default: `true`) |

> ⚠️ Never change `ENCRYPTION_KEY` after records are stored — existing records become permanently unreadable.

### Environment Variables (Frontend)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g. `http://localhost:5000/api/v1`) — validated at build time |
| `VITE_SOCKET_URL` | ✅ | Socket.io server URL (e.g. `http://localhost:5000`) — validated at build time |

---

## Project Structure

```
├── backend/src/
│   ├── server.js              # Entry: helmet→compression→cors→JSON→morgan → routes → Socket.io
│   ├── config/
│   │   ├── database.js        # Mongoose connection
│   │   ├── redis.js           # ioredis (lazyConnect: true)
│   │   ├── validateEnv.js     # Startup env validation — crashes fast if required vars missing
│   │   └── cloudinary.js      # Cloudinary SDK
│   ├── controllers/           # One controller per domain
│   ├── middleware/
│   │   ├── auth.js            # protect() + authorize(...roles) — Redis-cached user lookup
│   │   ├── auditLogger.js     # Wraps admin routes — writes AuditLog entries
│   │   └── errorHandler.js    # Global — masks 5xx messages in production
│   ├── models/                # 9 Mongoose schemas
│   ├── routes/                # Express routers (all at /api/v1/)
│   ├── services/              # notificationService, emailService, encryption.service
│   └── utils/
│       ├── userCache.js       # getCachedUser(), invalidateUserCache(), getOrSetCache()
│       ├── rateLimiter.js     # createRateLimiter() — Redis-backed factory
│       ├── logger.js          # Winston — stdout always; file transports dev-only
│       ├── jwt.js             # signAccessToken(), signRefreshToken(), verifyAccessToken()
│       └── pagination.js      # parsePagination(query, defaultLimit)
│
└── frontend/src/
    ├── App.jsx                # React Router v6 with ProtectedRoute role guards
    ├── store/
    │   ├── useAuthStore.js    # Zustand — tokens in memory only, non-sensitive fields persisted
    │   └── notificationStore.js
    ├── services/
    │   └── api.js             # Axios instance + auto token-refresh interceptor
    ├── pages/
    │   ├── patient/           # Dashboard, Queue, Appointments, HealthVault, Consent, Prescriptions
    │   ├── doctor/            # Dashboard, QueueManagement, PatientRecords, PrescriptionsList, SharedRecords
    │   └── admin/             # Dashboard, UserManagement, AuditLogs, Analytics, EmergencyReview
    └── components/            # Shared UI: layouts, navigation, NotificationBell
```

---

## AI Safety Design

MediQueue integrates Groq LLaMA 3.1 for two advisory features. The design follows a strict **human-in-the-loop** model.

### Principles

| Principle | Implementation |
|---|---|
| AI is never a hard dependency | Every AI call is `try/catch` wrapped. Queue join and record view work with Groq completely down or rate-limited |
| Raw medical text never leaves the platform unredacted | A PII redaction pass strips names, emails, phone numbers, and IDs before any text is sent to Groq |
| Final decision always belongs to the user | The backend never reads AI output to set queue priority — it only stores the AI suggestion for audit purposes |
| Every AI action is auditable | `AuditLog` entries written for every summarize call: who, which record, model, latency, success/fail |
| Features can be toggled independently | `AI_FEATURE_TRIAGE`, `AI_FEATURE_SUMMARIZE`, `AI_FEATURE_IMAGE_ANALYSIS` env flags — no redeploy needed |
| Prompt versioning | Every AI call carries a `promptVersion` field (e.g. `triage-v1`, `summary-v1`) for future auditability |

### Symptom Triage Flow

1. Patient types symptoms in the Join Queue form
2. "Suggest priority" button calls `POST /api/v1/queue/triage` (rate-limited: 5 req/min)
3. Groq returns `{ priority, reason, confidence }` — pre-fills the priority selector
4. Patient can override — if they do, `aiOverridden: true` is stored on the queue entry
5. Non-dismissable disclaimer always shown: *"AI suggests a priority level based on symptoms. This is not a medical diagnosis. A doctor will confirm."*

### Record Summarization Flow

1. Patient (or doctor with consent) opens a record and clicks "Summarize with AI"
2. Backend fetches the file from Cloudinary via server-side signed URL
3. **PDF path:** `pdf-parse` extracts text → PII stripped → sent to `llama-3.1-8b-instant`
4. **Image path:** file base64-encoded server-side → sent to `meta-llama/llama-4-scout-17b-16e-instruct` (multimodal)
5. Response: `{ summary, keyFindings, followUpNeeded, transcriptionConfidence }` — displayed in UI, never stored
6. Per-user quota: max 10 requests/hour (Redis counter, shared across PDF + image)
7. Non-dismissable disclaimer: *"AI-generated summary. Always consult your doctor for medical advice."*

### `transcriptionConfidence` field

| Value | Meaning | UI behaviour |
|---|---|---|
| `high` | Text printed or clearly legible | No additional warning |
| `medium` | Some words unclear, overall meaning confident | Amber note: *"Review key findings against your original document"* |
| `low` | Significant portions illegible | Red warning: *"Handwriting was difficult to read. Key details may be incomplete"* |

### Graceful Degradation

- `GROQ_API_KEY` missing → app starts normally, AI endpoints return `503` with a clear message
- Groq timeout (8 s) → one automatic retry, then fallback response
- `AI_FEATURE_*=false` → endpoint returns `503`, no Groq call is made

---

## License

This project is proprietary and confidential.
