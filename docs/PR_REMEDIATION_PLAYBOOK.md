# PR Remediation Playbook

## Purpose
This document is the execution guide for fixing the review findings through multiple focused pull requests.

Use this file to:
- implement each PR in the right order
- keep scope controlled
- validate behavior before merge
- reduce regression risk

## Global Rules For Every PR
- Keep each PR focused on one theme only.
- Do not mix unrelated refactors.
- Add or update tests for every behavior change.
- Run local verification before opening PR.
- Include rollback notes in the PR description.

## Standard PR Checklist

### Before Coding
- Confirm exact issue list for this PR.
- Confirm files that are in scope.
- Confirm expected behavior after fix.

### During Coding
- Make smallest safe change.
- Preserve existing architecture patterns.
- Use existing utilities and middleware patterns.
- Keep error handling explicit.

### Before Opening PR
- Backend lint passes.
- Backend tests pass.
- Frontend build passes.
- Manual API smoke checks pass for changed endpoints.
- Update docs if behavior changed.

### Merge Criteria
- CI green.
- No scope creep.
- Review comments resolved.
- Risk and rollback notes present.

---

## Execution Order
1. PR-1 P0 auth and contract hotfixes
2. PR-2 P0 specialty contract alignment
3. PR-3 P0 emergency module stabilization
4. PR-4 P1 hardening and performance

---

## PR-1 P0 Auth and Contract Hotfixes

### Objective
Fix production-breaking contract and authorization issues.

### Scope
- Fix appointment ownership check to use JWT userId.
- Align consent grant validator with current payload structure.
- Align forgot-password validator with controller and frontend payload.
- Remove duplicate consent revoke notification send.
- Fix notification and scheduler name mapping to personalInfo fields.

### Files Expected
- backend/src/controllers/appointmentController.js
- backend/src/middleware/validators.js
- backend/src/controllers/consentController.js
- backend/src/services/notificationService.js
- backend/src/services/appointmentScheduler.js

### Validation
- Appointment by id access works for patient, doctor, admin.
- Consent grant request accepted for valid payload.
- Forgot-password request accepted for phone or email input.
- Consent revoke emits one doctor notification only.
- Reminder and notification names render correctly.

### Exit Criteria
- No contract mismatch on auth, consent, and forgot-password routes.
- No authorization failures caused by wrong JWT field usage.

---

## PR-2 P0 Specialty Contract Alignment

### Objective
Remove specialty versus specialization drift across backend and frontend.

### Scope
- Standardize on professionalInfo.specialty.
- Update backend filters, populations, and mappings.
- Update frontend doctor list and doctor detail consumers.
- Add temporary read fallback if needed for legacy data.

### Files Expected
- backend/src/controllers/userController.js
- backend/src/controllers/consentController.js
- frontend/src/pages/patient/BookAppointment.jsx
- frontend/src/pages/patient/JoinQueue.jsx
- frontend/src/components/navigation/DoctorSidebar.jsx
- frontend/src/components/layouts/DoctorLayout.jsx
- frontend/src/pages/patient/QueueTracking.jsx
- frontend/src/pages/patient/HealthVault.jsx
- frontend/src/pages/patient/ConsentManagement.jsx

### Validation
- Doctor filtering by specialty works.
- Doctor specialty displays correctly across patient and doctor screens.
- Consent doctor details show specialty correctly.

### Exit Criteria
- All in-scope code reads and writes specialty consistently.

---

## PR-3 P0 Emergency Module Stabilization

### Objective
Fix emergency admin endpoints that reference fields not present in current schemas.

### Scope
- Refactor emergency controller queries and updates to actual Queue and Appointment schema fields.
- Remove or replace unsupported emergency-specific fields.
- If product needs missing fields, add schema updates in controlled manner.

### Files Expected
- backend/src/controllers/emergency.controller.js
- backend/src/models/Queue.js if schema extension is approved
- backend/src/models/Appointment.js if schema extension is approved
- backend/src/routes/admin.routes.js if temporary guard is needed

### Validation
- Admin emergency list endpoint returns expected data.
- Emergency status and assignment updates work without field errors.
- No empty results caused by querying non-existent fields.

### Exit Criteria
- Emergency endpoints are schema-compatible and stable.

---

## PR-4 P1 Security, Deployment, and Performance Hardening

### Objective
Address abuse risk, scaling bottlenecks, and deployment readiness gaps.

### Scope
- Escape user-provided regex input in admin and audit searches.
- Add consent mutation rate limiting.
- Add pagination to admin user listing and optimize stats calls.
- Reduce N+1 queries in shared-records retrieval.
- Improve startup env validation for provider-dependent features.
- Improve Docker readiness behavior and environment profile clarity.
- Gate frontend console logging for production.

### Files Expected
- backend/src/controllers/admin.controller.js
- backend/src/controllers/audit.controller.js
- backend/src/routes/consent.routes.js
- backend/src/controllers/recordController.js
- backend/src/config/validateEnv.js
- docker-compose.yml
- frontend files with console logs in changed scope

### Validation
- Admin and audit search remains functional with escaped regex inputs.
- Consent grant and revoke rate limit enforced.
- Admin users endpoint supports pagination.
- Shared-records endpoint query count reduced under load.
- Compose startup behavior is reliable.
- Production logging noise reduced.

### Exit Criteria
- Security and performance improvements verified with no regressions.

---

## PR Description Template
Copy this block into each PR and fill in the fields.

Title
- [Area] short summary

Summary
- What was broken
- What was changed
- Why this approach was chosen

Scope
- In scope files
- Out of scope files

Risk
- Main risk
- Mitigation

Validation
- Automated checks run
- Manual checks run
- Screenshots or request samples if useful

Rollback
- What to revert
- Any data migration rollback notes

---

## Suggested Branch Names
- hotfix/p0-auth-contract
- fix/p0-specialty-alignment
- fix/p0-emergency-schema-alignment
- hardening/p1-security-performance

## Suggested Local Verification Commands
From repository root:
- npm --prefix backend run lint
- npm --prefix backend test -- --passWithNoTests
- npm --prefix frontend run build

Optional container smoke test:
- docker-compose up -d --build
- docker-compose ps
- check health endpoints after startup
