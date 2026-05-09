## Plan: Recruiter Demo Accounts and Dataset

Create a deterministic, idempotent demo data system that seeds patient, doctor, and admin accounts plus realistic linked records, appointments, queue entries, and prescriptions. Keep auth flow unchanged, expose credentials in login UI only when demo mode is enabled, and support both local and hosted demo environments.

**Steps**
1. Phase 1: Seed foundation and script wiring.
2. Add backend script entrypoints in c:/Users/121pi/Desktop/care-valut/backend/package.json for seed demo and optional reset helper, with default path focused on idempotent reseeding.
3. Create a seed runner at c:/Users/121pi/Desktop/care-valut/backend/scripts/seed-demo.mjs that loads env, connects with existing DB config, executes ordered upserts, logs summary, and exits with non-zero on failure.
4. Add small seed helper modules under c:/Users/121pi/Desktop/care-valut/backend/scripts/factories/ for users, appointments, queue, records, and prescriptions to keep one concern per file. Step 4 depends on step 3.
5. Phase 2: Idempotent domain data creation.
6. Upsert demo users by stable unique keys (email and phone) with fixed credentials and role-correct profiles; enforce doctor professionalInfo.specialty and unique licenseNumber. Step 6 blocks steps 7-10.
7. Upsert appointments linked to seeded patient and doctor with valid future dates, required timeSlot fields, and stable external markers to avoid duplicates. Depends on step 6.
8. Upsert queue entries linked to appointment and doctor, using existing queue number strategy and deterministic per-day keying so reruns update rather than duplicate. Depends on step 7.
9. Upsert medical records with valid files array (absolute HTTPS fileUrl), metadata, visibility, and access links to seeded users. Depends on step 6.
10. Upsert prescriptions linked to same seeded patient-doctor pair with at least one medicine item and deterministic marker fields. Depends on step 6.
11. Phase 3: Recruiter UX and documentation.
12. Add a frontend demo toggle via VITE_DEMO_MODE in env examples and keep it optional for non-demo builds.
13. Add a conditional credentials panel in login page to display patient, doctor, and admin credentials only when VITE_DEMO_MODE is true, without changing existing submit/login behavior.
14. Document demo setup commands, default credentials, and demo-mode safety notes in README and deployment docs.
15. Phase 4: Verification and release readiness.
16. Verify seed script on a clean database and on a second rerun to confirm idempotency and stable counts.
17. Verify login for each role via existing flow and confirm role-based redirects and dashboard visibility.
18. Verify seeded linked data appears in target screens/API responses (appointments, queue, records, prescriptions) for both patient and doctor perspectives.
19. Run backend lint and targeted backend tests affected by seeded domains; run frontend build and smoke test login page with VITE_DEMO_MODE on and off.
20. Confirm security guardrails for demo deployment: demo env only, no production secrets, and explicit demo-mode config in deployment checklist.

**Relevant files**
- c:/Users/121pi/Desktop/care-valut/backend/package.json — add seed command wiring.
- c:/Users/121pi/Desktop/care-valut/backend/scripts/seed-demo.mjs — orchestration entrypoint for idempotent seeding.
- c:/Users/121pi/Desktop/care-valut/backend/scripts/factories/demoUsers.js — upsert users and role-specific payload builders.
- c:/Users/121pi/Desktop/care-valut/backend/scripts/factories/demoAppointments.js — upsert appointment dataset.
- c:/Users/121pi/Desktop/care-valut/backend/scripts/factories/demoQueue.js — queue seed logic with deterministic numbering strategy.
- c:/Users/121pi/Desktop/care-valut/backend/scripts/factories/demoRecords.js — record and file metadata seed logic.
- c:/Users/121pi/Desktop/care-valut/backend/scripts/factories/demoPrescriptions.js — prescription seed logic.
- c:/Users/121pi/Desktop/care-valut/backend/src/config/database.js — reuse DB connect pattern.
- c:/Users/121pi/Desktop/care-valut/backend/src/models/User.js — required fields, enums, hashing behavior.
- c:/Users/121pi/Desktop/care-valut/backend/src/models/Appointment.js — required appointment fields.
- c:/Users/121pi/Desktop/care-valut/backend/src/models/Queue.js — queue constraints and ordering behavior.
- c:/Users/121pi/Desktop/care-valut/backend/src/models/MedicalRecord.js — required files and sharing structures.
- c:/Users/121pi/Desktop/care-valut/backend/src/models/Prescription.js — required prescription schema fields.
- c:/Users/121pi/Desktop/care-valut/frontend/src/pages/auth/Login.jsx — conditional demo credentials panel.
- c:/Users/121pi/Desktop/care-valut/frontend/.env.example — demo mode toggle documentation.
- c:/Users/121pi/Desktop/care-valut/README.md — recruiter quick-start and credentials.
- c:/Users/121pi/Desktop/care-valut/docs/deployment-action.md — demo deployment guardrails.

**Verification**
1. Execute demo seed command once and confirm created and updated counts per collection in output summary.
2. Execute demo seed command again and confirm zero unintended duplicates and only expected updates.
3. Login with seeded patient, doctor, and admin credentials and verify correct redirect and accessible screens.
4. Check sample domain entities from UI or API for completeness: appointment timeline, queue status, medical records visibility, and prescriptions listing.
5. Run backend lint and relevant integration tests touching auth, queue, records, and prescriptions.
6. Run frontend build and smoke-check login page with VITE_DEMO_MODE true and false.

**Decisions**
- Included scope: full end-to-end seeded dataset and visible demo credentials panel.
- Environment scope: local plus hosted demo environment.
- Data lifecycle: idempotent upsert by default, with reset as optional helper not primary flow.
- Auth scope: no changes to registration/login contracts or token flow.

**Further Considerations**
1. Recommendation: keep demo accounts non-MFA for recruiter usability unless MFA demonstration is explicitly required.
2. Recommendation: use neutral fake medical content and synthetic file URLs to avoid compliance concerns.
3. Recommendation: add a deployment check that fails if demo mode is enabled for production target.
