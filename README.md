<div align="center">

# MediQueue — CareQueue + Health-Vault

### A production-grade healthcare operations platform built with security and real-time UX at its core.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongoosejs.com)
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

These are the engineering decisions worth talking about:

| Concern | Solution |
|---|---|
| Real-time queue updates | Socket.io v4 rooms (`user:<id>`) — server pushes diffs on every queue state change |
| Medical record security | AES-256-GCM encryption via a dedicated service; key separate from data |
| Authentication | Two-token JWT (15 min access + 7 day refresh) with a two-step OTP registration flow |
| Authorization | Stateless `protect()` + `authorize(...roles)` middleware; no DB hit on every request |
| Audit compliance | Immutable `AuditLog` model; middleware wraps every sensitive admin action automatically |
| Emergency access | Doctors can request override access; all overrides are logged and surfaced to admins for review |
| File uploads | Multer → Cloudinary storage; signed URLs for viewing — raw CDN URLs are never exposed to clients |
| AI triage | Groq LLaMA 3.1 suggests priority from symptoms — human override always preserved, AI is advisory only |
| AI summarization | On-demand PDF text extraction + LLaMA summary — quota-limited, PII-stripped before Groq sees any text |
| AI image analysis | Groq LLaMA 4 Scout (multimodal) reads consultation note images — confidence scoring flags unclear handwriting |

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

- **ES Modules** throughout the backend (`"type": "module"`) — native `import`/`export`, no CommonJS.
- **Stateless auth middleware** (`middleware/auth.js`) to keep hot-path requests fast; a separate DB-checking middleware exists only for the auth router.
- **`io` shared via `app.set('io', io)`** — controllers emit real-time events without coupling to the Socket layer.
- **Zustand** persisted to `localStorage` as `auth-storage`; the Axios interceptor reads the token directly from the store shape — no additional auth state duplication.

---

## API Surface

| Prefix | Responsibility |
|---|---|
| `POST /api/auth` | Register (OTP 2-step), login, refresh token, forgot/reset password |
| `GET/PUT /api/users` | Profile management |
| `GET/POST/DELETE /api/appointments` | Booking lifecycle |
| `GET/POST /api/queue` | Join queue, call-next, queue stats |
| `POST /api/queue/triage` | AI symptom triage — advisory suggestion only, never sets priority automatically |
| `GET/POST/DELETE /api/records` | Encrypted file upload, list, download, share, PDF export |
| `POST /api/records/:id/summarize` | On-demand AI summary of a text-based PDF record |
| `GET /api/records/:id/view-file` | Generate short-lived signed URL to view an attached file |
| `GET/POST/DELETE /api/consent` | Grant, revoke, and query consent grants |
| `GET/POST /api/emergency-access` | Doctor override requests |
| `GET/POST /api/prescriptions` | Create and view prescriptions |
| `GET /api/audit` | Tamper-evident audit log queries (admin) |
| `GET /api/analytics` | Dashboard metrics |
| `GET/POST/PUT/DELETE /api/admin` | User and emergency case management |
| `GET/POST /api/notifications` | Real-time notification inbox |

---

## Tech Stack

**Backend:** Node.js 18 · Express · MongoDB (Mongoose) · Socket.io v4 · JWT · bcrypt · Multer · node-cron · Nodemailer · Twilio

**Frontend:** React 18 · Vite · Tailwind CSS · Zustand · React Query · Axios · Socket.io-client · React Router v6

**Security:** AES-256-GCM (medical records) · JWT dual-token · OTP via SMS + email · RBAC · Helmet · Rate limiting · Immutable audit log

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

### Setup

```bash
# 1. Clone
git clone https://github.com/piyushkumar0707/MediQueue.git
cd MediQueue

# 2. Backend
cd backend
cp .env.example .env        # fill in MONGODB_URI, JWT secrets, ENCRYPTION_KEY (32 chars), Twilio/email
npm install
npm run dev                 # → http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env        # set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev                 # → http://localhost:5173
```

### Environment Variables (Backend)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Sign access tokens (short-lived) |
| `JWT_REFRESH_SECRET` | Sign refresh tokens |
| `ENCRYPTION_KEY` | Exactly 32 characters — AES-256 key for medical records |
| `TWILIO_*` | SMS OTP delivery |
| `EMAIL_*` | Email OTP delivery |
| `GROQ_API_KEY` | Groq LLaMA 3.1 API key — get free key at [console.groq.com](https://console.groq.com). If omitted, AI features degrade silently and the app still starts |
| `AI_FEATURE_TRIAGE` | `true` / `false` — toggle symptom triage without a redeploy (default: `true`) |
| `AI_FEATURE_SUMMARIZE` | `true` / `false` — toggle record summarization without a redeploy (default: `true`) |
| `AI_FEATURE_IMAGE_ANALYSIS` | `true` / `false` — toggle image analysis independently of PDF summarization (default: `true`) |

> ⚠️ Never change `ENCRYPTION_KEY` after records are stored — existing records become unreadable.

---

## Project Structure

```
├── backend/src/
│   ├── server.js              # Entry: middleware chain + route mount + Socket.io init
│   ├── config/                # DB connection, Multer config
│   ├── controllers/           # One controller per domain (auth, queue, records, etc.)
│   ├── middleware/            # auth.js (JWT-only) · authMiddleware.js · auditLogger.js
│   ├── models/                # 9 Mongoose schemas
│   ├── routes/                # Express routers (11 route files)
│   ├── services/              # notificationService, emailService, encryption.service
│   └── utils/                 # encryption, helpers
│
└── frontend/src/
    ├── App.jsx                # Route tree with role-gated <ProtectedRoute>
    ├── store/                 # useAuthStore (Zustand) · notificationStore
    ├── services/api.js        # Single Axios instance + interceptor
    ├── pages/
    │   ├── patient/           # Dashboard, Queue, Appointments, HealthVault, Consent, Prescriptions
    │   ├── doctor/            # Dashboard, QueueManagement, PatientRecords, Prescriptions
    │   └── admin/             # Dashboard, UserManagement, AuditLogs, Analytics, EmergencyReview
    └── components/            # Shared UI: layouts, navigation, common
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
| Every AI action is auditable | `AuditLog` entries are written for every summarize call: who, which record, model, latency, success/fail |
| Features can be toggled independently | `AI_FEATURE_TRIAGE` and `AI_FEATURE_SUMMARIZE` env flags disable either feature without a redeploy |
| Prompt versioning | Every AI call carries a `promptVersion` field (e.g. `triage-v1`, `summary-v1`) for future auditability |

### Symptom Triage Flow

1. Patient types symptoms in the Join Queue form
2. "Suggest priority" button calls `POST /api/queue/triage` (rate-limited: 5 req/min)
3. Groq returns `{ priority, reason, confidence }` — pre-fills the priority selector
4. Patient can override — if they do, `aiOverridden: true` is stored on the queue entry
5. A non-dismissable disclaimer is always shown: *"AI suggests a priority level based on symptoms. This is not a medical diagnosis. A doctor will confirm."*

### Record Summarization Flow

1. Patient opens a PDF or image record and clicks "Summarize with AI"
2. Backend fetches the file from Cloudinary via signed URL
3. **PDF path:** `pdf-parse` extracts text → PII stripped → sent to `llama-3.1-8b-instant`
4. **Image path:** file base64-encoded server-side (Cloudinary URL never sent to Groq) → sent to `meta-llama/llama-4-scout-17b-16e-instruct` (multimodal)
5. Response: `{ summary, keyFindings, followUpNeeded, transcriptionConfidence }` — displayed in the UI, never stored
6. `transcriptionConfidence` — `high | medium | low` — drives UI warnings for unclear handwriting
7. Per-user quota: max 10 requests/hour (Redis counter, shared across PDF + image)
8. Non-dismissable disclaimer: *"AI-generated summary. Always consult your doctor for medical advice."*

### `transcriptionConfidence` field

Included in all image analysis responses. Not present for PDF summaries.

| Value | Meaning | UI behaviour |
|---|---|---|
| `high` | Text printed or clearly legible | No additional warning |
| `medium` | Some words unclear, overall meaning confident | Soft amber note: *"Review key findings against your original document"* |
| `low` | Significant portions illegible | Red warning: *"Handwriting was difficult to read. Key details may be incomplete"* |

### Graceful Degradation

- `GROQ_API_KEY` missing → app starts normally, AI endpoints return `503` with a clear message
- Groq timeout (8 s) → one automatic retry, then fallback response — core feature still completes
- `AI_FEATURE_*=false` → endpoint returns `503`, no Groq call is made

---

## License

This project is proprietary and confidential.

