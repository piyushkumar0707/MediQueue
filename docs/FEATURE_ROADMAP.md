# CareQueue + Health-Vault Feature Implementation Roadmap

Complete feature-by-feature implementation guide with flows, dependencies, and technical specifications.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [User Management](#2-user-management)
3. [Appointment Booking System](#3-appointment-booking-system)
4. [Real-time Queue Management](#4-real-time-queue-management)
5. [Health Vault (Medical Records)](#5-health-vault-medical-records)
6. [Consent Management System](#6-consent-management-system)
7. [Emergency Override Protocol](#7-emergency-override-protocol)
8. [Prescription Management](#8-prescription-management)
9. [Notifications System](#9-notifications-system)
10. [Audit & Compliance](#10-audit--compliance)
11. [Analytics & Reporting](#11-analytics--reporting)
12. [Admin Dashboard](#12-admin-dashboard)

---

## Feature Priority Matrix

| Priority | Feature | Complexity | Est. Time | Dependencies |
|----------|---------|------------|-----------|--------------|
| P0 (Critical) | Authentication | High | 1 week | None |
| P0 (Critical) | User Management | Medium | 3 days | Authentication |
| P0 (Critical) | Queue Management | High | 1.5 weeks | Authentication, Users |
| P1 (High) | Appointment Booking | Medium | 1 week | Queue, Users |
| P1 (High) | Health Vault | High | 2 weeks | Authentication, Encryption |
| P1 (High) | Consent Management | High | 1.5 weeks | Health Vault, Users |
| P1 (High) | Emergency Override | High | 1 week | Consent, Audit |
| P2 (Medium) | Prescriptions | Medium | 1 week | Health Vault |
| P2 (Medium) | Notifications | Medium | 1 week | All features |
| P2 (Medium) | Audit Logs | Medium | 5 days | All features |
| P3 (Low) | Analytics | Low | 1 week | All features |
| P3 (Low) | Admin Dashboard | Low | 5 days | All features |

**Total Estimated Time: 10-12 weeks**

---

## 1. Authentication & Authorization

### Overview
Secure multi-role authentication system with JWT tokens, MFA, and session management.

### Features to Implement

#### 1.1 User Registration
**Complexity:** Medium | **Time:** 3 days

**Flow:**
```
START → Enter Phone Number → OTP Sent → Verify OTP → 
Select Role → Fill Profile Details → Set Password → 
MFA Setup (Mandatory) → Account Created → Auto Login
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/auth/register/initiate
   - Body: { phoneNumber, countryCode }
   - Response: { sessionId, otpSent: true }
   
   POST /api/auth/register/verify-otp
   - Body: { sessionId, otp }
   - Response: { verified: true, tempToken }
   
   POST /api/auth/register/complete
   - Body: { tempToken, role, personalInfo, password, mfaSecret }
   - Response: { user, accessToken, refreshToken }
   ```

2. **Database Models:**
   ```javascript
   User Model:
   - _id, phoneNumber, countryCode
   - role (patient/doctor/admin)
   - personalInfo { firstName, lastName, email, dob, gender }
   - password (bcrypt hashed)
   - mfaSecret (encrypted)
   - mfaEnabled (boolean, default true)
   - isVerified, isActive
   - timestamps
   ```

3. **Frontend Components:**
   - `RegisterForm.jsx` - Phone input with country code
   - `OTPVerification.jsx` - 6-digit input with resend
   - `RoleSelection.jsx` - Patient/Doctor/Admin cards
   - `ProfileSetup.jsx` - Multi-step form
   - `MFASetup.jsx` - QR code display + verification

4. **Validation Rules:**
   - Phone: Valid format, unique
   - Password: Min 8 chars, 1 uppercase, 1 number, 1 special
   - Email: Valid format, unique
   - Age: Min 18 years for patients, 25 for doctors

5. **Security Measures:**
   - Rate limiting: 3 attempts per 15 minutes per phone
   - OTP expiry: 5 minutes
   - OTP length: 6 digits
   - Temp token expiry: 15 minutes
   - MFA mandatory for all roles

#### 1.2 User Login
**Complexity:** Medium | **Time:** 2 days

**Flow:**
```
START → Enter Phone/Email + Password → Verify Credentials → 
MFA Prompt → Verify MFA Code → Generate JWT Tokens → 
Role Resolution → Redirect to Dashboard
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/auth/login
   - Body: { phoneOrEmail, password }
   - Response: { mfaRequired: true, sessionId }
   
   POST /api/auth/login/verify-mfa
   - Body: { sessionId, mfaCode }
   - Response: { user, accessToken, refreshToken }
   
   POST /api/auth/refresh-token
   - Body: { refreshToken }
   - Response: { accessToken, refreshToken }
   ```

2. **JWT Token Structure:**
   ```javascript
   Access Token (15 min expiry):
   {
     userId, role, permissions,
     iat, exp
   }
   
   Refresh Token (7 days expiry):
   {
     userId, tokenId,
     iat, exp
   }
   ```

3. **Frontend Components:**
   - `LoginForm.jsx` - Credentials input
   - `MFAVerification.jsx` - 6-digit code input
   - `RoleResolver.jsx` - Auto-redirect based on role

4. **Security Measures:**
   - Bcrypt password comparison
   - Rate limiting: 5 attempts per 15 minutes
   - Account lockout: 10 failed attempts (1 hour)
   - Session tracking in Redis
   - IP logging for audit

#### 1.3 Password Reset
**Complexity:** Low | **Time:** 2 days

**Flow:**
```
START → Enter Phone/Email → OTP Sent → Verify OTP → 
Enter New Password → Confirm Password → 
Password Updated → Force Logout All Sessions
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/auth/forgot-password
   - Body: { phoneOrEmail }
   - Response: { otpSent: true, sessionId }
   
   POST /api/auth/reset-password
   - Body: { sessionId, otp, newPassword }
   - Response: { success: true }
   ```

2. **Security Measures:**
   - OTP expiry: 10 minutes
   - Invalidate all refresh tokens
   - Force logout from all devices
   - Email notification of password change

#### 1.4 Session Management
**Complexity:** Medium | **Time:** 2 days

**Implementation:**
- Redis for session storage
- Session expiry: 24 hours inactive
- Max concurrent sessions: 3 per user
- Automatic refresh token rotation
- Session revocation API

**Backend API Endpoints:**
```
GET /api/auth/sessions
- Response: { sessions: [{ deviceInfo, lastActive, location }] }

DELETE /api/auth/sessions/:sessionId
- Response: { success: true }

DELETE /api/auth/sessions/all
- Response: { revokedCount }
```

---

## 2. User Management

### Overview
Manage user profiles, roles, permissions, and account settings.

### Features to Implement

#### 2.1 User Profile Management
**Complexity:** Low | **Time:** 3 days

**Flow:**
```
User → View Profile → Edit Information → 
Validate Changes → Update Database → 
Show Success Message
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   GET /api/users/profile
   - Response: { user: { personalInfo, settings, stats } }
   
   PUT /api/users/profile
   - Body: { personalInfo }
   - Response: { user }
   
   PUT /api/users/settings
   - Body: { notificationPrefs, privacySettings }
   - Response: { settings }
   
   POST /api/users/profile-picture
   - Body: FormData (image file)
   - Response: { imageUrl }
   ```

2. **Profile Fields:**
   - Personal: Name, DOB, Gender, Blood Group
   - Contact: Phone, Email, Address
   - Medical (Patient): Allergies, Chronic conditions, Emergency contact
   - Professional (Doctor): License, Specialty, Qualification, Experience

3. **Frontend Components:**
   - `ProfileView.jsx` - Display mode
   - `ProfileEdit.jsx` - Edit mode with validation
   - `ImageUpload.jsx` - Profile picture with crop
   - `MedicalInfoForm.jsx` - Patient-specific fields

#### 2.2 Doctor Profile (Extended)
**Complexity:** Medium | **Time:** 2 days

**Additional Fields:**
- Medical license number + verification
- Specialization (dropdown)
- Qualifications (multi-select)
- Years of experience
- Consultation fee
- Available days/hours
- Department assignment
- Bio/About section

**Verification Flow:**
```
Doctor Submits License → Admin Reviews → 
Document Verification → Status Update → 
Email Notification
```

#### 2.3 Admin User Management
**Complexity:** Medium | **Time:** 3 days

**Features:**
- Create/Edit/Deactivate users
- Assign roles and permissions
- Reset passwords
- View user activity logs
- Bulk user import (CSV)

**Backend API Endpoints:**
```
GET /api/admin/users?page=1&limit=50&role=doctor&status=active
POST /api/admin/users (Create new user)
PUT /api/admin/users/:userId (Update user)
DELETE /api/admin/users/:userId (Soft delete)
POST /api/admin/users/:userId/reset-password
POST /api/admin/users/bulk-import
```

---

## 3. Appointment Booking System

### Overview
Multi-step appointment booking with doctor availability, slot management, and token generation.

### Features to Implement

#### 3.1 Department & Doctor Selection
**Complexity:** Medium | **Time:** 2 days

**Flow:**
```
Patient → Select Department → View Available Doctors → 
View Doctor Profile (Rating, Exp, Fee) → Select Doctor → 
Check Availability → Proceed
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   GET /api/departments
   - Response: { departments: [{ id, name, icon, doctorCount }] }
   
   GET /api/doctors?departmentId=123&date=2024-01-20
   - Response: { doctors: [{ id, name, specialty, rating, fee, availableSlots }] }
   
   GET /api/doctors/:doctorId/profile
   - Response: { doctor: { fullDetails, reviews, stats } }
   ```

2. **Database Models:**
   ```javascript
   Department Model:
   - _id, name, description, icon
   - isActive, displayOrder
   
   Doctor Model (extends User):
   - specialization, qualifications
   - consultationFee, rating, reviewCount
   - availability: [{ day, startTime, endTime }]
   - maxPatientsPerDay, slotDuration (minutes)
   ```

3. **Frontend Components:**
   - `DepartmentGrid.jsx` - Card grid with search
   - `DoctorList.jsx` - Filterable list with sort
   - `DoctorCard.jsx` - Profile card with quick actions
   - `DoctorProfileModal.jsx` - Detailed view

#### 3.2 Date & Time Slot Selection
**Complexity:** Medium | **Time:** 3 days

**Flow:**
```
Patient → Select Date (Calendar) → 
Fetch Available Slots → Display Slots (Morning/Afternoon/Evening) → 
Select Slot → Validate Availability → Lock Slot (5 min)
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   GET /api/appointments/slots?doctorId=123&date=2024-01-20
   - Response: { 
       slots: [
         { time: "09:00", available: true, patientsBooked: 2 },
         { time: "09:30", available: false, patientsBooked: 5 }
       ],
       maxPerSlot: 5
     }
   
   POST /api/appointments/lock-slot
   - Body: { doctorId, date, time }
   - Response: { lockId, expiresAt }
   ```

2. **Slot Generation Logic:**
   ```javascript
   // Generate slots based on doctor availability
   function generateSlots(doctor, date) {
     const dayAvailability = doctor.availability.find(a => a.day === date.getDay());
     const slots = [];
     let currentTime = dayAvailability.startTime;
     
     while (currentTime < dayAvailability.endTime) {
       // Check existing bookings
       const bookedCount = getBookedCount(doctor._id, date, currentTime);
       
       slots.push({
         time: currentTime,
         available: bookedCount < doctor.maxPatientsPerDay,
         patientsBooked: bookedCount
       });
       
       currentTime = addMinutes(currentTime, doctor.slotDuration);
     }
     
     return slots;
   }
   ```

3. **Frontend Components:**
   - `CalendarPicker.jsx` - Date selection (disable past dates)
   - `SlotGrid.jsx` - Time slots grouped by period
   - `SlotCard.jsx` - Individual slot with availability
   - `SlotTimer.jsx` - 5-minute countdown for locked slot

4. **Slot Locking Mechanism:**
   - Lock duration: 5 minutes
   - Store in Redis: `slot-lock:{doctorId}:{date}:{time}:{userId}`
   - Auto-release if not confirmed
   - Prevent double booking

#### 3.3 Appointment Confirmation & Token Generation
**Complexity:** Medium | **Time:** 2 days

**Flow:**
```
Patient → Review Booking Details → Enter Additional Info (Symptoms) → 
Submit → Generate Token → Save to Database → 
Send Notifications (SMS + Email) → Show Success Screen
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/appointments/book
   - Body: {
       lockId,
       doctorId,
       departmentId,
       date,
       timeSlot,
       symptoms,
       notes
     }
   - Response: { 
       appointment: { 
         id, 
         tokenNumber, 
         qrCode, 
         estimatedTime 
       }
     }
   
   GET /api/appointments/:appointmentId
   - Response: { appointment }
   ```

2. **Token Generation Logic:**
   ```javascript
   // Generate unique token for the day
   function generateToken(departmentId, date) {
     const prefix = getDepartmentPrefix(departmentId); // A, B, C, etc.
     const count = getTodayAppointmentCount(departmentId, date);
     return `${prefix}-${count + 1}`; // A-1, A-2, etc.
   }
   ```

3. **Database Models:**
   ```javascript
   Appointment Model:
   - _id, tokenNumber
   - patientId, doctorId, departmentId
   - appointmentDate, timeSlot
   - symptoms, notes
   - status (pending/confirmed/in-progress/completed/cancelled)
   - queuePosition, estimatedWaitTime
   - checkInTime, consultationStartTime, consultationEndTime
   - createdAt, updatedAt
   ```

4. **QR Code Generation:**
   - Data: `{ appointmentId, tokenNumber, patientId, date }`
   - Format: QR Code image (base64)
   - Used for: Check-in, verification

5. **Notifications:**
   - SMS: Appointment confirmation with token
   - Email: Detailed booking confirmation + calendar invite
   - Push: In-app notification

#### 3.4 Appointment Management
**Complexity:** Low | **Time:** 2 days

**Features:**
- View upcoming appointments
- View appointment history
- Cancel appointment (if >2 hours before slot)
- Reschedule appointment
- Download appointment details (PDF)

**Backend API Endpoints:**
```
GET /api/appointments?status=upcoming&page=1
PUT /api/appointments/:appointmentId/cancel
PUT /api/appointments/:appointmentId/reschedule
GET /api/appointments/:appointmentId/download
```

**Cancellation Rules:**
- Must be >2 hours before appointment
- Auto-refund if payment done
- Notification to doctor
- Slot released for others

---

## 4. Real-time Queue Management

### Overview
Live queue tracking with WebSocket, token calling system, and real-time position updates.

### Features to Implement

#### 4.1 Queue Display System
**Complexity:** High | **Time:** 3 days

**Flow:**
```
Patient Checks In → Added to Queue → 
Real-time Position Updates (WebSocket) → 
Display on Patient Dashboard + TV Screens → 
Doctor Calls Next → Patient Notified → 
Patient Moves to Consultation
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   GET /api/queue/today?departmentId=123
   - Response: { 
       queue: [
         { 
           tokenNumber, 
           patientName, 
           status, 
           position, 
           estimatedWaitTime 
         }
       ],
       stats: { waiting, inProgress, completed }
     }
   
   POST /api/queue/check-in
   - Body: { appointmentId, qrCode }
   - Response: { queueEntry, position }
   
   GET /api/queue/my-position
   - Response: { position, estimatedWait, status }
   ```

2. **WebSocket Events:**
   ```javascript
   // Server → Client
   socket.emit('queue:updated', { departmentId, queue });
   socket.emit('queue:position-changed', { userId, newPosition, estimatedWait });
   socket.emit('queue:called', { userId, tokenNumber, cabin });
   socket.emit('queue:status-changed', { tokenNumber, status });
   
   // Client → Server
   socket.emit('queue:subscribe', { departmentId, userId });
   socket.emit('queue:unsubscribe', { departmentId });
   ```

3. **Queue State Management:**
   ```javascript
   Queue Entry:
   - appointmentId, tokenNumber
   - patientId, doctorId, departmentId
   - status (waiting/called/in-progress/completed/skipped)
   - queuePosition, checkInTime
   - calledTime, consultationStartTime, consultationEndTime
   - estimatedWaitTime (calculated)
   ```

4. **Wait Time Calculation:**
   ```javascript
   function calculateWaitTime(position, doctorId) {
     const avgConsultationTime = getDoctorAvgTime(doctorId); // 15 min
     const currentPatientRemainingTime = getRemainingTime();
     
     return currentPatientRemainingTime + (position - 1) * avgConsultationTime;
   }
   ```

5. **Frontend Components:**
   - `QueueTracker.jsx` - Live queue display
   - `QueuePosition.jsx` - Patient's position card
   - `QueueList.jsx` - Full queue list
   - `TVDisplay.jsx` - Large screen display for waiting area

#### 4.2 Doctor Queue Management
**Complexity:** High | **Time:** 4 days

**Flow:**
```
Doctor Login → View Today's Queue → 
[Call Next Patient] → Patient Notified (WebSocket + SMS) → 
Patient Arrives → Mark In Progress → Timer Starts → 
Consultation → Add Notes → Mark Completed → 
Auto-call Next (or Manual)
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   GET /api/doctor/queue/today
   - Response: { 
       current: { patient, startTime, duration },
       next: [{ token, patient, symptoms }],
       waiting: [{ token, patient, waitTime }],
       completed: [{ token, patient, duration }],
       stats: { total, completed, avgTime }
     }
   
   POST /api/doctor/queue/call-next
   - Response: { patient, notificationSent }
   
   POST /api/doctor/queue/skip
   - Body: { tokenNumber, reason }
   - Response: { success }
   
   POST /api/doctor/queue/mark-in-progress
   - Body: { tokenNumber }
   - Response: { success, startTime }
   
   POST /api/doctor/queue/complete-consultation
   - Body: { tokenNumber, notes, diagnosis, followUp, prescriptionIssued }
   - Response: { success }
   
   POST /api/doctor/queue/pause
   - Body: { reason, duration }
   - Response: { success }
   ```

2. **Queue Actions:**
   - **Call Next**: Notify patient (push + SMS + WebSocket), update status to "called"
   - **Skip**: Move to end of queue with reason, notify patient
   - **In Progress**: Start consultation timer, lock patient record
   - **Complete**: Save notes, stop timer, calculate avg time, auto-call next
   - **Pause Queue**: Temporary break (lunch, emergency), display on patient screens

3. **Frontend Components:**
   - `DoctorQueueDashboard.jsx` - Overview with stats
   - `CurrentPatientCard.jsx` - Large card with patient info
   - `NextInLineSection.jsx` - Preview next 3-5 patients
   - `WaitingListSection.jsx` - Scrollable list
   - `CompletedSection.jsx` - Today's completed list
   - `QueueControlButtons.jsx` - Call/Skip/Pause actions
   - `ConsultationTimer.jsx` - Live timer

4. **Notifications:**
   - Patient called: Push notification + SMS + Full-screen takeover
   - Queue paused: Banner on patient screens
   - Position updates: Real-time via WebSocket

#### 4.3 Queue Analytics
**Complexity:** Low | **Time:** 2 days

**Metrics to Track:**
- Average wait time per department
- Average consultation time per doctor
- Peak hours analysis
- Patient throughput
- Queue abandonment rate

**Backend API Endpoints:**
```
GET /api/queue/analytics?departmentId=123&dateRange=7days
- Response: { 
    avgWaitTime,
    avgConsultationTime,
    totalPatients,
    completionRate,
    peakHours: [{ hour, count }],
    trends: [{ date, waitTime, throughput }]
  }
```

---

## 5. Health Vault (Medical Records)

### Overview
Secure, encrypted medical records storage with access control and audit trails.

### Features to Implement

#### 5.1 Record Storage & Encryption
**Complexity:** High | **Time:** 4 days

**Flow:**
```
Patient → Upload Record → Validate File → 
Encrypt File (AES-256) → Store in Cloud (S3/MinIO) → 
Save Metadata in Database → Generate Thumbnail → 
Show Success
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/health-records/upload
   - Body: FormData { file, recordType, date, notes }
   - Response: { recordId, url, encryptionConfirmed }
   
   GET /api/health-records?patientId=123&type=lab-report
   - Response: { records: [{ id, type, date, uploadedBy, accessCount }] }
   
   GET /api/health-records/:recordId/download
   - Response: Decrypted file stream
   
   DELETE /api/health-records/:recordId
   - Response: { success }
   ```

2. **Encryption Implementation:**
   ```javascript
   const crypto = require('crypto');
   
   function encryptFile(buffer, patientId) {
     const algorithm = 'aes-256-gcm';
     const key = deriveKey(patientId); // Patient-specific key
     const iv = crypto.randomBytes(16);
     
     const cipher = crypto.createCipheriv(algorithm, key, iv);
     const encrypted = Buffer.concat([
       cipher.update(buffer),
       cipher.final()
     ]);
     
     const authTag = cipher.getAuthTag();
     
     return {
       encrypted,
       iv: iv.toString('hex'),
       authTag: authTag.toString('hex')
     };
   }
   
   function decryptFile(encrypted, iv, authTag, patientId) {
     const algorithm = 'aes-256-gcm';
     const key = deriveKey(patientId);
     
     const decipher = crypto.createDecipheriv(
       algorithm,
       key,
       Buffer.from(iv, 'hex')
     );
     decipher.setAuthTag(Buffer.from(authTag, 'hex'));
     
     return Buffer.concat([
       decipher.update(encrypted),
       decipher.final()
     ]);
   }
   ```

3. **Database Models:**
   ```javascript
   HealthRecord Model:
   - _id, patientId
   - recordType (lab-report/prescription/scan/consultation/other)
   - title, description, notes
   - uploadDate, recordDate
   - uploadedBy (userId)
   - fileMetadata: {
       originalName,
       mimeType,
       size,
       encryptedPath,
       iv,
       authTag,
       thumbnailPath
     }
   - tags: [String]
   - isEncrypted: true
   - accessLog: [{ userId, timestamp, action }]
   - isDeleted, deletedAt
   ```

4. **File Storage:**
   - Cloud: AWS S3 or MinIO (self-hosted)
   - Path structure: `{patientId}/{year}/{month}/{recordId}.enc`
   - Thumbnails: For images/PDFs
   - Max file size: 50MB per record
   - Allowed types: PDF, JPG, PNG, DICOM

5. **Frontend Components:**
   - `FileUpload.jsx` - Drag & drop with preview
   - `RecordTypeSelector.jsx` - Dropdown with icons
   - `RecordsList.jsx` - Timeline/grid view
   - `RecordViewer.jsx` - PDF/image viewer
   - `RecordDetailModal.jsx` - Full details + access history

#### 5.2 Record Sharing & Access Control
**Complexity:** High | **Time:** 3 days

**Flow:**
```
Patient → Select Records → Choose Recipient (Doctor/Hospital) → 
Set Permissions (View only/Download) → Set Expiry → 
Send Request → Recipient Notified → 
Recipient Accepts → Access Granted → All Actions Logged
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/health-records/share
   - Body: { 
       recordIds: [],
       recipientId,
       permissions: ['view', 'download'],
       expiryDate,
       purpose
     }
   - Response: { shareId, notificationSent }
   
   GET /api/health-records/shared-with-me
   - Response: { shares: [{ patient, records, permissions, expiryDate }] }
   
   PUT /api/health-records/share/:shareId/revoke
   - Response: { success }
   ```

2. **Access Control:**
   - Default: Only patient has access
   - Explicit sharing: Patient grants access to specific users
   - Time-limited: Auto-revoke after expiry
   - Granular permissions: View, download, print
   - Emergency override: Special case (see Feature #7)

#### 5.3 Record Access History
**Complexity:** Low | **Time:** 2 days

**Flow:**
```
Every Access → Log Entry Created → 
Patient → View Access History → 
Filter by Date/User → View Details → 
[Flag Suspicious Access]
```

**Implementation:**
```javascript
AccessLog Model:
- recordId, patientId
- accessedBy (userId, role)
- action (view/download/share)
- timestamp, ipAddress, deviceInfo
- purpose (if emergency override)
- isSuspicious (flagged)
```

**Frontend:**
- `AccessHistoryTable.jsx` - Sortable, filterable table
- Shows: Who, When, What action, IP address
- Red flag for emergency override
- Export to CSV option

---

## 6. Consent Management System

### Overview
Granular consent management for medical record access with request/grant/revoke flows.

### Features to Implement

#### 6.1 Consent Request (Doctor → Patient)
**Complexity:** Medium | **Time:** 3 days

**Flow:**
```
Doctor → View Patient (No Consent) → Request Access → 
Fill Form (Purpose, Records Needed, Duration) → 
Submit → Patient Notified (Push + SMS) → 
Patient Reviews Request → Patient Grants/Denies → 
Doctor Notified → Access Granted/Denied
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/consent/request
   - Body: {
       patientId,
       recordTypes: ['lab-reports', 'prescriptions'],
       purpose,
       requestedDuration,
       urgency
     }
   - Response: { requestId, notificationSent }
   
   GET /api/consent/requests/pending
   - Response: { requests: [{ doctor, purpose, recordTypes, requestedAt }] }
   
   PUT /api/consent/requests/:requestId/respond
   - Body: { action: 'grant|deny', duration, reason }
   - Response: { success, accessGranted }
   
   GET /api/consent/active
   - Response: { consents: [{ doctor, records, expiryDate, grantedAt }] }
   ```

2. **Database Models:**
   ```javascript
   ConsentRequest Model:
   - _id, patientId, doctorId
   - recordTypes: [String]
   - purpose, urgency (low/medium/high)
   - requestedDuration (days)
   - status (pending/granted/denied/expired)
   - requestedAt, respondedAt
   - patientResponse: { action, reason, duration }
   
   Consent Model:
   - _id, patientId, doctorId
   - recordTypes: [String]
   - permissions: ['view', 'download']
   - purpose
   - grantedAt, expiresAt
   - status (active/revoked/expired)
   - revokedAt, revokeReason
   ```

3. **Frontend Components:**
   - `ConsentRequestForm.jsx` (Doctor side)
   - `PendingConsentCard.jsx` (Patient side)
   - `ConsentReviewModal.jsx` (Patient review + decision)
   - `ActiveConsentsList.jsx` (Patient view)
   - `ConsentIndicator.jsx` (Badge showing consent status)

4. **Notifications:**
   - Patient: New consent request (push + SMS)
   - Doctor: Request granted/denied (push + email)
   - Patient: Consent expiring soon (24h before)
   - Doctor: Consent revoked notification

#### 6.2 Consent Revocation
**Complexity:** Low | **Time:** 2 days

**Flow:**
```
Patient → View Active Consents → Select Consent → 
[Revoke Access] → Confirm → Immediate Revocation → 
Doctor Notified → Access Blocked
```

**Implementation:**
```
PUT /api/consent/:consentId/revoke
- Body: { reason }
- Response: { success, doctorNotified }
```

**Effects:**
- Immediate access block
- Doctor notification
- Audit log entry
- Hide records from doctor's view

#### 6.3 Emergency Access Alert
**Complexity:** Medium | **Time:** 2 days

**Flow:**
```
Doctor Uses Emergency Override → Patient Notified Immediately → 
Alert Shown on Patient Dashboard → Patient Views Details → 
Patient Can File Complaint → Admin Reviews
```

**Implementation:**
- Real-time alert via WebSocket
- Critical notification (red banner)
- Show: Doctor name, time, records accessed, justification
- Action buttons: "View Details", "File Complaint"

---

## 7. Emergency Override Protocol

### Overview
Life-threatening emergency access to patient records without consent, with heavy logging and admin review.

### Features to Implement

#### 7.1 Emergency Override Flow
**Complexity:** High | **Time:** 4 days

**Flow:**
```
Doctor → No Consent Available → Click "Emergency Override" → 
Warning Screen (Checkboxes) → Continue → 
Justification Form (Type, Reason, Witness) → 
Submit → Immediate Access Granted → 
Patient Notified → Admin Notified → 
Access Logged Heavily → Admin Review Triggered
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/emergency-access/initiate
   - Body: {
       patientId,
       emergencyType,
       justification (min 50 chars),
       witnessName,
       witnessId
     }
   - Response: { 
       accessGranted: true,
       sessionId,
       expiresAt,
       reviewId 
     }
   
   GET /api/emergency-access/active
   - Response: { 
       activeSession: { 
         patient, 
         startTime, 
         recordsAccessed: [], 
         reviewStatus 
       } 
     }
   
   POST /api/emergency-access/end-session
   - Body: { sessionId, notes }
   - Response: { success }
   ```

2. **Database Models:**
   ```javascript
   EmergencyAccess Model:
   - _id, doctorId, patientId
   - emergencyType (cardiac/trauma/respiratory/neurological/other)
   - justification, witnessName, witnessId
   - startTime, endTime, duration
   - recordsAccessed: [{ recordId, accessTime }]
   - notes, treatmentProvided
   - ipAddress, deviceInfo, location
   - reviewStatus (pending/approved/flagged/rejected)
   - reviewedBy, reviewedAt, reviewComments
   - patientNotified, patientNotifiedAt
   - adminNotified, adminNotifiedAt
   ```

3. **Logging Requirements:**
   - Every record access logged with timestamp
   - Screenshot/metadata capture (optional)
   - IP address, device info, location
   - Full audit trail
   - Cannot be deleted or modified

4. **Frontend Components:**
   - `EmergencyWarningModal.jsx` - Warning with checkboxes
   - `EmergencyJustificationForm.jsx` - Detailed form
   - `EmergencyBanner.jsx` - Persistent red banner during access
   - `EmergencyTimer.jsx` - Session duration timer

5. **Security Measures:**
   - Minimum justification length: 50 characters
   - Witness info required (name + ID)
   - Session expires after 4 hours (configurable)
   - Cannot be used >3 times per day per doctor
   - Rate limiting: Max 5 per month per doctor

#### 7.2 Admin Emergency Review
**Complexity:** Medium | **Time:** 3 days

**Flow:**
```
Emergency Override Triggered → Auto-create Review Task → 
Admin Dashboard Alert → Admin Opens Review → 
View Full Details (Doctor, Patient, Justification, Records) → 
Verify Legitimacy → Check Checklist → 
Decision: Approve/Reject/Flag → Add Comments → 
Submit → Doctor Notified → Patient Notified
```

**Implementation:**

1. **Backend API Endpoints:**
   ```
   GET /api/admin/emergency-reviews?status=pending
   - Response: { 
       reviews: [{
         id,
         doctor,
         patient,
         emergencyDetails,
         recordsAccessed,
         timeline,
         priority
       }]
     }
   
   PUT /api/admin/emergency-reviews/:reviewId/complete
   - Body: {
       decision: 'approve|reject|flag',
       checklist: { verified: boolean, ... },
       comments
     }
   - Response: { success }
   ```

2. **Review Checklist:**
   - [ ] Emergency situation verified
   - [ ] Doctor credentials verified
   - [ ] Justification adequate
   - [ ] Records accessed appropriate for emergency type
   - [ ] Witness information valid
   - [ ] No policy violations detected
   - [ ] Patient consent unavailable confirmed

3. **Review SLA:**
   - High priority: 24 hours
   - Medium priority: 48 hours
   - Low priority: 72 hours
   - Escalation if not reviewed

---

## 8. Prescription Management

### Overview
Digital prescription creation, management, and sharing system.

### Features to Implement

#### 8.1 Prescription Creation
**Complexity:** Medium | **Time:** 4 days

**Flow:**
```
Doctor → Complete Consultation → Create Prescription → 
Add Diagnosis → Add Medications (Autocomplete) → 
For Each Med: Set Dosage, Frequency, Duration, Instructions → 
Add Additional Notes → Set Follow-up Date → 
Preview → Sign Digitally → Send to Patient → 
Save to Health Vault
```

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/prescriptions/create
   - Body: {
       patientId,
       appointmentId,
       diagnosis,
       medications: [{
         name,
         dosage,
         frequency,
         duration,
         instructions,
         timing
       }],
       additionalNotes,
       followUpDate,
       labTests: []
     }
   - Response: { prescriptionId, pdfUrl }
   
   GET /api/prescriptions/:prescriptionId
   - Response: { prescription }
   
   GET /api/prescriptions/patient/:patientId
   - Response: { prescriptions: [] }
   ```

2. **Database Models:**
   ```javascript
   Prescription Model:
   - _id, patientId, doctorId, appointmentId
   - prescriptionNumber (auto-generated)
   - diagnosis
   - medications: [{
       name,
       dosage,
       frequency (1x/2x/3x/4x per day),
       duration (days),
       instructions,
       timing (before-meal/after-meal/empty-stomach)
     }]
   - additionalNotes
   - followUpDate
   - labTestsRecommended: [String]
   - issuedDate
   - validUntil (90 days default)
   - digitalSignature
   - status (active/fulfilled/expired)
   
   Medication Master:
   - _id, name, genericName
   - category, subcategory
   - commonDosages: [String]
   - commonFrequencies: [String]
   - sideEffects: [String]
   - contraindications: [String]
   ```

3. **Medication Autocomplete:**
   ```
   GET /api/medications/search?q=paracet
   - Response: { 
       medications: [{
         name: "Paracetamol 500mg",
         genericName: "Acetaminophen",
         commonDosages: ["500mg", "650mg"],
         commonFrequencies: ["1-1-1", "1-0-1"]
       }]
     }
   ```

4. **PDF Generation:**
   - Hospital letterhead
   - Doctor information (name, license, specialty)
   - Patient information
   - Date, prescription number
   - Diagnosis
   - Rx section with all medications in table
   - Additional notes
   - Follow-up date
   - Digital signature
   - QR code for verification

5. **Frontend Components:**
   - `PrescriptionForm.jsx` - Main form
   - `MedicationInput.jsx` - Autocomplete with suggestions
   - `MedicationRow.jsx` - Single medication entry
   - `PrescriptionPreview.jsx` - PDF preview before saving
   - `DigitalSignature.jsx` - Signature capture/verification

#### 8.2 Prescription Verification
**Complexity:** Low | **Time:** 2 days

**Features:**
- QR code on prescription
- Scan to verify authenticity
- Check: Doctor license, prescription validity, tampering

**Implementation:**
```
GET /api/prescriptions/verify?qrCode=...
- Response: { 
    valid: true,
    prescription: { doctor, patient, medications, issueDate },
    warnings: []
  }
```

---

## 9. Notifications System

### Overview
Multi-channel notification system (Push, SMS, Email, In-app) for all critical events.

### Features to Implement

#### 9.1 Notification Channels
**Complexity:** Medium | **Time:** 4 days

**Channels:**
1. **Push Notifications** (Firebase/OneSignal)
2. **SMS** (Twilio)
3. **Email** (NodeMailer/SendGrid)
4. **In-app** (WebSocket)

**Implementation Steps:**

1. **Backend API Endpoints:**
   ```
   POST /api/notifications/send
   - Body: {
       userId,
       type,
       channels: ['push', 'sms', 'email'],
       data: { title, body, action }
     }
   
   GET /api/notifications?page=1&limit=20
   - Response: { notifications: [], unreadCount }
   
   PUT /api/notifications/:notificationId/read
   
   PUT /api/notifications/read-all
   
   GET /api/notifications/preferences
   PUT /api/notifications/preferences
   ```

2. **Database Models:**
   ```javascript
   Notification Model:
   - _id, userId
   - type (appointment/queue/consent/emergency/system)
   - priority (low/medium/high/critical)
   - channels: ['push', 'sms', 'email', 'in-app']
   - data: {
       title,
       body,
       action (URL/deep link),
       metadata: {}
     }
   - status: {
       sent: boolean,
       delivered: boolean,
       read: boolean,
       clicked: boolean
     }
   - sentAt, deliveredAt, readAt, clickedAt
   - expiresAt
   ```

3. **Notification Types:**
   ```javascript
   const NOTIFICATION_TYPES = {
     // Appointments
     APPOINTMENT_CONFIRMED: {
       title: 'Appointment Confirmed',
       channels: ['push', 'sms', 'email'],
       priority: 'medium'
     },
     APPOINTMENT_REMINDER: {
       title: 'Appointment Tomorrow',
       channels: ['push', 'sms'],
       priority: 'medium'
     },
     APPOINTMENT_CANCELLED: {
       title: 'Appointment Cancelled',
       channels: ['push', 'sms', 'email'],
       priority: 'high'
     },
     
     // Queue
     QUEUE_CALLED: {
       title: "You're Called!",
       channels: ['push', 'sms', 'in-app'],
       priority: 'critical'
     },
     QUEUE_POSITION_UPDATE: {
       title: 'Queue Update',
       channels: ['in-app'],
       priority: 'low'
     },
     
     // Consent
     CONSENT_REQUEST: {
       title: 'New Consent Request',
       channels: ['push', 'sms'],
       priority: 'high'
     },
     CONSENT_GRANTED: {
       title: 'Consent Granted',
       channels: ['push', 'email'],
       priority: 'medium'
     },
     CONSENT_EXPIRING: {
       title: 'Consent Expiring Soon',
       channels: ['push'],
       priority: 'low'
     },
     
     // Emergency
     EMERGENCY_ACCESS_ALERT: {
       title: '⚠️ Emergency Access to Your Records',
       channels: ['push', 'sms', 'email'],
       priority: 'critical'
     },
     
     // Prescriptions
     PRESCRIPTION_READY: {
       title: 'Prescription Ready',
       channels: ['push', 'email'],
       priority: 'medium'
     }
   };
   ```

4. **Frontend Components:**
   - `NotificationBell.jsx` - Header bell icon with badge
   - `NotificationPanel.jsx` - Dropdown panel
   - `NotificationList.jsx` - Paginated list
   - `NotificationItem.jsx` - Single notification card
   - `NotificationPreferences.jsx` - Settings page

#### 9.2 Notification Preferences
**Complexity:** Low | **Time:** 2 days

**User Settings:**
- Enable/disable per notification type
- Choose channels (push/SMS/email)
- Quiet hours (no push notifications)
- Email digest (daily summary)

**Database:**
```javascript
NotificationPreference Model:
- userId
- preferences: {
    appointments: { push: true, sms: true, email: true },
    queue: { push: true, sms: false, email: false },
    consent: { push: true, sms: true, email: true },
    emergency: { push: true, sms: true, email: true }, // Cannot disable
    prescriptions: { push: true, sms: false, email: true }
  }
- quietHours: { enabled, start, end }
- emailDigest: { enabled, frequency: 'daily' }
```

---

## 10. Audit & Compliance

### Overview
Comprehensive audit logging for HIPAA/regulatory compliance.

### Features to Implement

#### 10.1 Audit Logging
**Complexity:** Medium | **Time:** 3 days

**What to Log:**
- All user authentication events
- Medical record access (view/download/share)
- Consent grant/revoke
- Emergency override usage
- Prescription creation
- User management actions
- System configuration changes

**Implementation:**

1. **Database Model:**
   ```javascript
   AuditLog Model:
   - _id, timestamp
   - userId, userRole
   - action (login/view-record/emergency-override/etc)
   - resourceType (user/record/appointment/etc)
   - resourceId
   - details: { before, after, metadata }
   - ipAddress, userAgent, deviceInfo, location
   - severity (info/warning/critical)
   - tags: [String]
   ```

2. **Backend API Endpoints:**
   ```
   POST /api/audit/log (Internal use)
   
   GET /api/audit/logs?page=1&action=emergency-override
   - Response: { logs: [], totalCount }
   
   GET /api/audit/logs/user/:userId
   GET /api/audit/logs/resource/:resourceId
   
   POST /api/audit/logs/export
   - Body: { dateRange, actions, format: 'csv|json' }
   ```

3. **Middleware:**
   ```javascript
   // Auto-log middleware
   function auditMiddleware(req, res, next) {
     res.on('finish', () => {
       if (AUDITABLE_ROUTES.includes(req.path)) {
         createAuditLog({
           userId: req.user.id,
           action: getActionFromRoute(req.method, req.path),
           resourceType: getResourceType(req.path),
           resourceId: req.params.id,
           details: { body: req.body, query: req.query },
           ipAddress: req.ip,
           userAgent: req.headers['user-agent']
         });
       }
     });
     next();
   }
   ```

#### 10.2 Compliance Reports
**Complexity:** Low | **Time:** 2 days

**Reports:**
- Emergency access usage report (monthly)
- Record access summary per patient
- Failed login attempts
- Data export logs
- User activity summary

**Implementation:**
```
GET /api/reports/emergency-access?month=2024-01
GET /api/reports/record-access?patientId=123
GET /api/reports/security-incidents
```

---

## 11. Analytics & Reporting

### Overview
System-wide analytics for operations and decision-making.

### Features to Implement

#### 11.1 Dashboard Analytics
**Complexity:** Medium | **Time:** 4 days

**Metrics:**
- Daily/weekly/monthly patient volume
- Average wait time trends
- Doctor utilization rates
- Department performance
- Peak hours heatmap
- Appointment cancellation rate
- Queue abandonment rate
- Patient satisfaction (future)

**Implementation:**

1. **Backend API Endpoints:**
   ```
   GET /api/analytics/overview?dateRange=7days
   - Response: {
       totalPatients,
       avgWaitTime,
       completionRate,
       peakHour,
       trends: []
     }
   
   GET /api/analytics/department/:deptId
   GET /api/analytics/doctor/:doctorId
   GET /api/analytics/wait-time-trends
   GET /api/analytics/peak-hours
   ```

2. **Data Aggregation:**
   - Use MongoDB aggregation pipeline
   - Cache results in Redis (15-min TTL)
   - Background jobs for daily/weekly calculations

3. **Frontend Components:**
   - `AnalyticsDashboard.jsx`
   - `MetricCard.jsx` - Summary cards
   - `TrendChart.jsx` - Line/bar charts (Chart.js)
   - `HeatMap.jsx` - Peak hours visualization
   - `DepartmentComparison.jsx` - Side-by-side comparison

---

## 12. Admin Dashboard

### Overview
Centralized admin control panel for system management.

### Features to Implement

#### 12.1 System Health Monitoring
**Complexity:** Low | **Time:** 2 days

**Monitor:**
- API server status
- Database connection
- WebSocket connections
- Queue processing
- File storage availability

**Implementation:**
```
GET /api/admin/system-health
- Response: {
    api: { status: 'online', uptime: 99.8, responseTime: 45 },
    database: { status: 'online', connections: 12 },
    websocket: { status: 'online', connections: 145 },
    storage: { status: 'online', usage: '45%' }
  }
```

#### 12.2 User Management
Covered in Feature #2.3

#### 12.3 Emergency Access Review
Covered in Feature #7.2

#### 12.4 System Configuration
**Complexity:** Low | **Time:** 2 days

**Settings:**
- Queue configuration (max tokens, reset time)
- Appointment slot duration
- Notification templates
- Security settings (MFA, session timeout)
- File upload limits
- Emergency override rules

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-3)
- Authentication & Authorization
- User Management
- Basic Profile Setup

### Phase 2: Core Features (Weeks 4-7)
- Appointment Booking
- Queue Management (Real-time)
- Health Vault (Storage + Encryption)

### Phase 3: Advanced Features (Weeks 8-10)
- Consent Management
- Emergency Override
- Prescriptions
- Notifications

### Phase 4: Admin & Compliance (Weeks 11-12)
- Audit Logging
- Analytics Dashboard
- Admin Tools
- Compliance Reports

---

## Testing Requirements

### Unit Tests
- All API endpoints
- Business logic functions
- Encryption/decryption
- Token generation

### Integration Tests
- Authentication flows
- Appointment booking flow
- Queue management
- Consent request/grant flow

### E2E Tests (Cypress)
- Complete patient journey
- Doctor workflow
- Admin operations

### Security Tests
- Penetration testing
- SQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting validation

### Load Tests
- Concurrent user simulation
- WebSocket connection stress
- Database query performance
- File upload/download stress

---

## Deployment Checklist

### Pre-Production
- [ ] All features tested
- [ ] Security audit completed
- [ ] Performance optimization done
- [ ] Database indexes created
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Documentation completed

### Production
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Database backup automated
- [ ] Log aggregation setup (ELK/CloudWatch)
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (Pingdom/UptimeRobot)

---

**End of Feature Roadmap**

This document should be updated as implementation progresses and requirements evolve.
