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
| File uploads | Multer disk storage, 5-file / 10 MB limit, served via authenticated static route |

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
| `GET/POST/DELETE /api/records` | Encrypted file upload, list, download, share, PDF export |
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

## License

This project is proprietary and confidential.

