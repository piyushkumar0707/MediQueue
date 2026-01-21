# Doctor App Screens

Complete documentation for doctor-facing application screens.

---

## Screen Overview

1. Doctor Dashboard
2. Queue Management
3. Patient Records Access
4. Emergency Override Flow
5. Prescriptions
6. Complete Consultation

---

## Key Features

### 1. Doctor Dashboard
- Today's queue summary (total, waiting, completed)
- Current patient card
- Queue status toggle (Active/Paused)
- Quick actions (Call Next, View Records, Prescriptions)
- Recent activity timeline

### 2. Queue Management
- **In Progress** section (current patient)
- **Next in Line** (call/skip actions)
- **Waiting List** (all pending patients)
- **Completed Today** (history)
- Pause queue functionality (break mode)

### 3. Patient Records - No Consent
- Basic information (always visible)
- Locked medical records section
- Request access form with justification
- Emergency override link (red, bottom)

### 4. Patient Records - Access Granted
- Full medical history
- Previous consultations
- Lab reports and imaging
- Prescriptions
- Access logged automatically

### 5. Emergency Override Flow

**Step 1: Warning Screen**
```
⚠️ EMERGENCY OVERRIDE WARNING

You are about to access patient records without consent.

THIS ACTION:
• Will be PERMANENTLY LOGGED
• Must be JUSTIFIED
• Will NOTIFY the patient immediately
• Will be REVIEWED by admin
• May be subject to INVESTIGATION

[Checkbox] I understand this is a life-threatening emergency
[Cancel]  [⚠️ Continue]
```

**Step 2: Justification**
```
🚨 EMERGENCY ACCESS JUSTIFICATION

Patient: [Name]
Time: [Timestamp]

Justification * (Minimum 50 characters)
[Text area with details about emergency]

Emergency Type *
[Dropdown: Cardiac Emergency, Severe Trauma, etc.]

Witness (Optional)
[Name/ID of witness]

[Cancel]  [🚨 Grant Access]
```

**Step 3: Emergency Banner**
```
🚨 EMERGENCY ACCESS ACTIVE
Accessed: [Time] | Patient notified | Admin review: Pending
```

### 6. Prescriptions

**Create Prescription:**
- Patient information
- Diagnosis field
- Multiple medications support
- Dosage, frequency, duration
- Instructions per medication
- Additional notes
- Follow-up date
- Preview before sending

**Prescription Preview:**
- Hospital letterhead
- Doctor information
- Patient details
- Diagnosis
- Rx section with all medications
- Doctor signature (digital)
- Export PDF option

### 7. Complete Consultation Modal
- Consultation notes/diagnosis
- Follow-up required toggle
- Checkboxes (prescription issued, lab tests, upload notes)
- Complete & Next button

---

## Doctor Navigation

**Side Navigation:**
- 🏠 Dashboard
- ⏱️ Queue Management
- 👥 Patients
- 💊 Prescriptions
- 📊 Analytics (optional)
- ⚙️ Settings

---

## Queue States & Actions

### Patient States
- 🟡 Waiting
- 🔵 Called
- 🟢 In Progress
- ⚪ Completed
- ❌ Cancelled
- ⏭️ Skipped

### Doctor Actions
- **Call Next Patient** → Notifies patient
- **Skip** → Moves to end of queue
- **Mark In Progress** → Timer starts
- **Complete** → Requires notes
- **Pause Queue** → Break mode with reason

---

## Prescription Features

### Medication Entry
- Autocomplete search
- Predefined dosages
- Common frequencies
- Standard durations
- Custom instructions

### Safety Features
- Drug interaction warnings (future)
- Allergy alerts
- Dosage validation
- Duplicate medication check

---

## Security & Compliance

### Record Access
- **Default**: Limited basic info only
- **With Consent**: Full access (logged)
- **Emergency Override**: Full access (heavily logged + reviewed)

### Audit Trail
Every action logged:
- User ID
- Timestamp
- Action type
- Patient ID
- IP address
- Device information

---

## Mobile Considerations

### Doctor Mobile View
```
┌─────────────────────────┐
│ Dr. Sharma      [🔔(5)] │
├─────────────────────────┤
│ 🎫 Current Patient      │
│ Token: A-38             │
│ Rajesh Kumar (M, 45)    │
│ [View Records]          │
│ [Complete]              │
├─────────────────────────┤
│ Today's Queue (5)       │
│ 🟡 A-39 | Next          │
│ [Call] [Skip]           │
│                         │
│ 🟡 A-40 | Waiting       │
│ [Details]               │
├─────────────────────────┤
│ [⏸️ Pause Queue]        │
└─────────────────────────┘
```

---

## Error Handling

### Common Scenarios
- Patient not checked in → Warning
- Consultation time < 2 mins → Confirmation required
- Missing notes → Validation error
- Network error → Retry option
- Token already completed → Alert

---

**End of Doctor Screens Documentation**

For detailed layouts and ASCII diagrams, refer to the full conversation history or request specific screen details.
