# AI Feature Rollout Plan — MediQueue

**Stack:** Groq LLaMA 3.1 (free tier) · Node.js/Express backend · React frontend  
**Features:** Symptom triage + Medical record summarization  
**Design principle:** Human-in-the-loop at every decision point. AI is advisory, never authoritative.  
**Timeline:** ~2 weeks total

---

## Scope

### In scope
- AI triage suggestion on queue join
- AI record summarization in Health Vault
- Human override preserved at every decision point
- Audit metadata for every AI action
- Graceful degradation — core features work with AI unavailable
- Prompt versioning for auditability

### Out of scope (MVP)
- Autonomous diagnosis or forced emergency escalation
- Full OCR for scanned/image-only PDFs
- Persisting AI summaries to the database
- Multi-model routing or provider fallback

---

## Hard rules — apply to every phase

These constraints are non-negotiable. If any AI call violates them, it does not ship.

1. **AI is never a hard dependency.** Every call is wrapped in `try/catch`. Queue join and record view must work with Groq completely down or rate-limited.
2. **Raw medical text is never logged or stored.** Only structured AI output and metadata reach logs.
3. **Final priority is always the user's choice.** The backend never infers or overrides priority from AI output.
4. **Every AI action produces an audit trail.** Feature, model, promptVersion, latencyMs, success/fail — nothing else.
5. **Disclaimer copy is non-dismissable** in both triage and summary UI.

---

## Phase 1 — AI foundation and safety rails

> Everything else depends on this. Do not start Phase 2 or 4 until all five deliverables are complete.

**Estimated time:** ~2 days  
**Depends on:** nothing

### Deliverables

All five are required before any feature code is written.

- [ ] Create `backend/src/services/aiService.js` with a `callAI(prompt, schema, options)` wrapper that handles: 8-second timeout, one automatic retry, JSON schema validation, and safe parsing
- [ ] Add `GROQ_API_KEY` to `validateEnv.js` as a **warning, not a crash** — if missing, AI features degrade silently and the app still starts
- [ ] Add feature flags object read from env: `AI_FEATURES = { triage: true, summarize: true }` — each feature can be toggled off independently without a deploy
- [ ] Define a standard AI response envelope used by every AI call:
  ```json
  {
    "success": true,
    "data": {},
    "model": "llama-3.1-8b-instant",
    "latencyMs": 312,
    "promptVersion": "triage-v1",
    "fallback": false
  }
  ```
- [ ] Write a redaction helper that strips names, phone numbers, emails, and IDs from any text before it is sent to Groq

### Files to create or touch

- `backend/src/services/aiService.js` ← new
- `backend/src/config/validateEnv.js`
- `backend/.env.example` — add `GROQ_API_KEY=`

---

## Phase 2 — Symptom triage — backend

> A dedicated triage endpoint that is advisory only. It never touches queue priority directly.

**Estimated time:** ~1.5 days  
**Depends on:** Phase 1

### Tasks

- [ ] Add `POST /api/queue/triage` — accepts `{ symptoms }`, calls `aiService`, returns `{ priority, reason, confidence }`
- [ ] Triage prompt uses `temperature: 0.1` and `response_format: { type: "json_object" }` for consistent, low-variance output
- [ ] Extend Queue schema with optional AI metadata fields (see below)
- [ ] Update `joinQueue` to accept and store `aiMetadata` from the request body — server-side logic never reads it to determine priority
- [ ] Apply per-user rate limit on triage endpoint: 5 requests/minute using existing `express-rate-limit`

### Queue schema additions

```js
// All fields optional — only populated when AI was used
aiSuggestedPriority: String,        // what the model returned: 'normal' | 'urgent' | 'emergency'
aiConfidence:        String,        // 'low' | 'medium' | 'high'
aiReason:            String,        // one-sentence rationale shown to the patient
aiOverridden:        Boolean,       // true if the user changed the AI suggestion
promptVersion:       String,        // e.g. 'triage-v1' — tracks which prompt produced this result
```

### Triage prompt (v1)

```
System:
You are a medical triage assistant. Based on the patient's symptoms, return ONLY valid JSON:
{
  "priority": "normal | urgent | emergency",
  "reason": "one sentence explanation",
  "confidence": "low | medium | high"
}

Emergency = potentially life-threatening (chest pain, difficulty breathing, severe bleeding).
Urgent = needs attention soon but not immediately life-threatening.
Normal = routine, can wait.
Never explain your reasoning outside the JSON object.

User:
{symptoms}
```

### Files to touch

- `backend/src/routes/queue.routes.js`
- `backend/src/controllers/queueController.js`
- `backend/src/models/Queue.js`

---

## Phase 3 — Symptom triage — frontend

> The UI must make it obvious that AI is assisting, not deciding.

**Estimated time:** ~1 day  
**Depends on:** Phase 2

### Tasks

- [ ] Add "Suggest priority" button next to `reasonForVisit` in `JoinQueue.jsx` — calls `/api/queue/triage` on click, not on every keystroke
- [ ] Pre-fill priority selector from AI response; show confidence badge and one-sentence reason below the selector
- [ ] Priority selector remains fully editable — if the user changes it, set `aiOverridden: true` in the submit payload
- [ ] Show a non-dismissable disclaimer:
  > *"AI suggests a priority level based on symptoms. This is not a medical diagnosis. A doctor will confirm."*
- [ ] Handle all three non-happy states without blocking form submission:
  - Loading — spinner on the button, form still submittable
  - Error / timeout — "AI suggestion unavailable. Please select priority manually."
  - Feature disabled — button hidden entirely

### Files to touch

- `frontend/src/pages/patient/JoinQueue.jsx`
- `frontend/src/services/api.js`

---

## Phase 4 — Record summarization — backend

> Generate on demand, not stored. Avoids cache invalidation and keeps implementation simple.

**Estimated time:** ~1.5 days  
**Depends on:** Phase 1 (can run in parallel with Phase 3)

### Decision — on demand, not persisted

Summaries are generated fresh on each request. The `MedicalRecord` schema is not modified. If a record is summarized twice, two AI calls are made — acceptable at portfolio scale. Persist only if cost becomes a real concern at scale.

### Tasks

- [ ] Add `POST /api/records/:id/summarize` — reuses the existing record authorization path, no new permission logic
- [ ] Create `backend/src/services/pdfTextExtractor.js` using `pdf-parse` (free npm package, no external API) — MVP scope: text-based PDFs only; return a clean structured error for image-only PDFs
- [ ] Summarization prompt uses `temperature: 0.2`, returns:
  ```json
  {
    "summary": "2-3 sentence plain-English summary",
    "keyFindings": ["finding 1", "finding 2"],
    "followUpNeeded": true
  }
  ```
- [ ] Write an `AuditLog` entry for every summarize action: who, which record, when — reuse existing audit infrastructure
- [ ] Per-user quota: max 10 summarize requests/hour via Redis counter (reuse existing Redis client)
- [ ] Response includes `promptVersion: "summary-v1"` for future tracking

### Summarization prompt (v1)

```
System:
You are a medical assistant helping patients understand their own health records.
Summarize the following document in plain English that a non-medical person can understand.
Return ONLY valid JSON:
{
  "summary": "2-3 sentence overview",
  "keyFindings": ["finding 1", "finding 2"],
  "followUpNeeded": true | false
}
Do not include the patient's name or any identifying information in the output.
Never diagnose. Never recommend treatment.

User:
Record type: {recordType}

{extractedText}
```

### Files to touch

- `backend/src/routes/record.routes.js`
- `backend/src/controllers/recordController.js`
- `backend/src/services/pdfTextExtractor.js` ← new

---

## Phase 5 — Record summarization — frontend

> The summary is an enhancement, never a replacement. All existing flows remain unaffected.

**Estimated time:** ~1 day  
**Depends on:** Phase 4

### Tasks

- [ ] Add "Summarize with AI" button to the record detail modal in `HealthVault.jsx` — visible only for PDF records
- [ ] Render on success: summary paragraph, key findings list, follow-up indicator, and a generated timestamp
- [ ] Handle three failure states with distinct, specific messages:
  - Extraction failed: "This PDF appears to be a scanned image. AI summarization requires a text-based PDF."
  - AI timeout: "Summary took too long. Please try again."
  - AI unavailable: "AI summarization is currently unavailable."
- [ ] Show non-dismissable disclaimer below every summary:
  > *"AI-generated summary. Always consult your doctor for medical advice."*

### Files to touch

- `frontend/src/pages/patient/HealthVault.jsx`
- `frontend/src/services/api.js`

---

## Phase 6 — Hardening and tests

> Write the test names before writing the tests. If you cannot name a test precisely, you have not thought about the edge case.

**Estimated time:** ~2 days  
**Depends on:** Phases 2–5

### Triage test cases

```
should return 'emergency' for "chest pain, left arm numb, heavy sweating"
should return 'urgent' for "high fever, can't keep food down, exhausted 3 days"
should return 'normal' for "mild headache for two days, no fever"
should fall back gracefully when Groq times out — queue join still succeeds
should return 400 if symptoms field is empty or missing
should respect AI_FEATURES.triage=false — endpoint returns 503, no Groq call made
should store aiOverridden=true when user changes the suggested priority
```

### Summarization test cases

```
should return 403 if requesting user does not have record access
should return structured summary for a valid text-based PDF
should return extraction-failed error for an image-only PDF (not a 500)
should enforce per-user rate limit — 11th request in one hour returns 429
should create an AuditLog entry for every successful summarize action
should fall back gracefully when Groq returns malformed JSON
should respect AI_FEATURES.summarize=false — endpoint returns 503, no Groq call made
```

### Telemetry rules

- [ ] Log only: feature, promptVersion, latencyMs, success/fail, model name
- [ ] Never log raw symptoms text or extracted record content
- [ ] Verify redaction helper strips PII before any text reaches Groq

---

## Phase 7 — Recruiter-ready demo packaging

> The failure demo is the most important scenario. It proves you built it correctly, not just that it works when everything goes right.

**Estimated time:** ~1 day  
**Depends on:** Phase 6

### Five demo scenarios

| # | Type | Input | Expected outcome |
|---|---|---|---|
| 1 | Normal | "Mild headache for two days, no fever" | AI suggests normal · disclaimer visible · patient can override |
| 2 | Urgent + override | "High fever, can't keep food down, exhausted for 3 days" | AI suggests urgent · patient overrides to normal · `aiOverridden: true` stored |
| 3 | Emergency | "Chest pain, left arm numb, heavy sweating" | AI suggests emergency, high confidence · doctor queue ordering unaffected |
| 4 | Record summary | Lab report PDF with abnormal CBC values | Key findings in plain English · follow-up flagged · audit log entry visible |
| 5 | Failure path | Groq API key revoked or timeout simulated | Queue join succeeds · summary shows clean error · no crash · no 500 |

### README additions

- [ ] Add an **"AI Safety Design"** section covering: human-in-the-loop model, graceful degradation, audit trail, prompt versioning
- [ ] Update Postman collection with `/queue/triage` and `/records/:id/summarize` — include a failure-case example for each
- [ ] Document the `AI_FEATURES` flag in setup instructions so reviewers can toggle features independently

### Resume line

> *"Integrated Groq LLaMA 3.1 for real-time symptom triage and on-demand medical record summarization — built with graceful AI degradation, prompt versioning for auditability, and human override preserved at every decision point"*

---

## File map — everything touched across all phases

```
backend/
  src/
    services/
      aiService.js              ← new (Phase 1)
      pdfTextExtractor.js       ← new (Phase 4)
    config/
      validateEnv.js            ← Phase 1
    controllers/
      queueController.js        ← Phase 2
      recordController.js       ← Phase 4
    routes/
      queue.routes.js           ← Phase 2
      record.routes.js          ← Phase 4
    models/
      Queue.js                  ← Phase 2

frontend/
  src/
    pages/
      patient/
        JoinQueue.jsx           ← Phase 3
        HealthVault.jsx         ← Phase 5
    services/
      api.js                    ← Phase 3 + 5

.env.example                    ← Phase 1
README.md                       ← Phase 7
CareQueue-API-Complete.postman_collection.json  ← Phase 7
```

---

## Dependency order

```
Phase 1 (foundation)
  ├── Phase 2 (triage backend)
  │     └── Phase 3 (triage frontend)
  └── Phase 4 (summary backend)      ← can run parallel to Phase 3
        └── Phase 5 (summary frontend)
              └── Phase 6 (hardening + tests)
                    └── Phase 7 (demo packaging)
```

Do not start Phase 2 or Phase 4 before Phase 1 is fully complete.  
Phase 3 and Phase 4 can be built in parallel once their respective backend phase is done.
