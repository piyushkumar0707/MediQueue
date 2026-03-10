# CareQueue + Health-Vault — Project Diagrams

---

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client Layer"]
        B[Browser / Mobile]
    end

    subgraph Frontend["Frontend — React 18 + Vite  :5173"]
        RC[React Components]
        RR[React Router v6\nProtectedRoute]
        ZS[Zustand Store\nuseAuthStore · notificationStore]
        RQ[React Query\nServer State Cache]
        AX[Axios Instance\napi.js · Auth Interceptor]
        SC[Socket.io Client]
    end

    subgraph Backend["Backend — Node.js 18 / Express  :5000"]
        direction TB
        MW[Middleware Stack\nhelmet · cors · compression · morgan]
        JA[JWT Auth\nauth.js — JWT only\nauthMiddleware.js — DB lookup]
        RO[Routes\nauth · users · appointments\nqueue · records · consent\nprescriptions · audit\nanalytics · admin · notifications]
        CT[Controllers]
        SV[Services\nnotificationService · emailService\nappointmentScheduler node-cron]
        SIO[Socket.io Server v4\nRooms: user:id · role:role · dept:dept]
        MU[Multer\nDisk → uploads/medical-records/\n10 MB · 5 files max]
        EN[AES-256 Encryption\nMedical Records  ENCRYPTION_KEY 32-char]
        AL[Audit Logger\nauditLogger.js · Admin routes]
    end

    subgraph Database["Database — MongoDB"]
        MDB[(MongoDB\ncarequeue)]
        IDX[Indexes\nappointmentDate · status\ndoctor + status]
    end

    subgraph External["External Services"]
        TW[Twilio\nSMS OTP]
        EM[Nodemailer\nEmail OTP + Reminders]
        FS[File System\nuploads/]
    end

    B --> Frontend
    AX -->|HTTP REST| MW
    SC -->|WebSocket| SIO
    MW --> JA
    JA --> RO
    RO --> CT
    CT --> SV
    CT --> MU
    CT --> EN
    CT --> AL
    CT --> MDB
    SV --> TW
    SV --> EM
    SV --> SIO
    MU --> FS
    MDB --> IDX

    classDef clientNode fill:#bfdbfe,stroke:#2563eb,color:#1e3a5f
    classDef frontendNode fill:#bbf7d0,stroke:#16a34a,color:#14532d
    classDef backendNode fill:#fde68a,stroke:#d97706,color:#451a03
    classDef dbNode fill:#fbcfe8,stroke:#db2777,color:#500724
    classDef extNode fill:#e9d5ff,stroke:#9333ea,color:#3b0764

    class B clientNode
    class RC,RR,ZS,RQ,AX,SC frontendNode
    class MW,JA,RO,CT,SV,SIO,MU,EN,AL backendNode
    class MDB,IDX dbNode
    class TW,EM,FS extNode

    style Client fill:#1e3a5f,stroke:#60a5fa,color:#ffffff
    style Frontend fill:#14532d,stroke:#4ade80,color:#ffffff
    style Backend fill:#713f12,stroke:#fbbf24,color:#ffffff
    style Database fill:#500724,stroke:#f472b6,color:#ffffff
    style External fill:#3b0764,stroke:#c084fc,color:#ffffff
```

---

## 2. Database ER Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string phoneNumber UK
        string email UK
        string password
        enum role "patient|doctor|admin"
        string[] permissions
        object personalInfo "firstName, lastName, DOB, gender, bloodGroup, address"
        object doctorInfo "specialization, licenseNumber, department, experience"
        boolean isActive
        boolean isVerified
        boolean isEmailVerified
        object otpData "otp, expiresAt, verified"
        string refreshToken
        date lastLogin
        timestamps createdAt_updatedAt
    }

    APPOINTMENT {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId doctor FK
        ObjectId queueEntry FK
        date appointmentDate
        object timeSlot "startTime, endTime"
        enum status "scheduled|confirmed|checked-in|in-progress|completed|cancelled|no-show"
        enum type "consultation|follow-up|emergency|routine-checkup"
        string reasonForVisit
        string[] symptoms
        boolean reminderSent24h
        boolean reminderSent1h
        timestamps createdAt_updatedAt
    }

    QUEUE {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId doctor FK
        ObjectId appointment FK
        number queueNumber
        enum status "waiting|in-progress|completed|cancelled|no-show"
        enum priority "normal|urgent|emergency"
        date checkInTime
        date calledTime
        date completedTime
        number estimatedWaitTime
        string reasonForVisit
        string consultationRoom
        timestamps createdAt_updatedAt
    }

    MEDICALRECORD {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId uploadedBy FK
        enum recordType "lab-report|prescription|radiology|..."
        string title
        date recordDate
        array files "fileName, fileUrl, fileType, fileSize"
        object metadata "hospital, doctorName, department, diagnosis, tags"
        boolean isEncrypted
        string encryptionKey
        timestamps createdAt_updatedAt
    }

    PRESCRIPTION {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId doctor FK
        ObjectId appointment FK
        ObjectId queueEntry FK
        string prescriptionNumber UK
        string diagnosis
        array medicines "name, dosage, frequency, duration, timing"
        string[] tests
        enum status "active|completed|cancelled"
        date followUpDate
        timestamps createdAt_updatedAt
    }

    CONSENT {
        ObjectId _id PK
        ObjectId patient FK
        ObjectId doctor FK
        ObjectId[] specificRecords FK
        enum scope "all-records|specific-records|record-types"
        string[] recordTypes
        object permissions "canView, canDownload, canShare"
        enum status "active|revoked|expired|pending"
        date expiresAt
        string purpose
        date consentGivenAt
        timestamps createdAt_updatedAt
    }

    EMERGENCYACCESS {
        ObjectId _id PK
        ObjectId doctor FK
        ObjectId patient FK
        ObjectId reviewedBy FK
        enum emergencyType "life-threatening|cardiac-emergency|..."
        string justification
        string location
        string facilityName
        enum status "pending|active|expired|revoked|denied"
        date requestedAt
        date expiresAt
        date reviewedAt
        string reviewNotes
        timestamps createdAt_updatedAt
    }

    AUDITLOG {
        ObjectId _id PK
        ObjectId userId FK
        enum action "LOGIN|LOGOUT|RECORD_ACCESSED|CONSENT_GRANTED|..."
        string resourceId
        string resourceType
        object details
        string ipAddress
        string userAgent
        enum severity "low|medium|high|critical"
        timestamps createdAt_updatedAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipient FK
        ObjectId sender FK
        enum type "consent_request|appointment_booked|queue_update|..."
        string title
        string message
        enum priority "low|medium|high|urgent"
        boolean isRead
        object relatedResource "resourceId, resourceType"
        timestamps createdAt_updatedAt
    }

    USER ||--o{ APPOINTMENT : "patient books"
    USER ||--o{ APPOINTMENT : "doctor attends"
    USER ||--o{ QUEUE : "patient joins"
    USER ||--o{ QUEUE : "doctor manages"
    APPOINTMENT ||--o| QUEUE : "creates"
    USER ||--o{ MEDICALRECORD : "patient owns"
    USER ||--o{ MEDICALRECORD : "uploaded by"
    USER ||--o{ PRESCRIPTION : "patient receives"
    USER ||--o{ PRESCRIPTION : "doctor writes"
    APPOINTMENT ||--o| PRESCRIPTION : "associated"
    QUEUE ||--o| PRESCRIPTION : "associated"
    USER ||--o{ CONSENT : "patient grants"
    USER ||--o{ CONSENT : "doctor receives"
    MEDICALRECORD ||--o{ CONSENT : "covers specific"
    USER ||--o{ EMERGENCYACCESS : "doctor requests"
    USER ||--o{ EMERGENCYACCESS : "patient target"
    USER ||--o| EMERGENCYACCESS : "admin reviews"
    USER ||--o{ AUDITLOG : "actor"
    USER ||--o{ NOTIFICATION : "recipient"
    USER ||--o{ NOTIFICATION : "sender"
```

---

## 3. Event Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    actor D as Doctor
    actor A as Admin
    participant FE as Frontend (React)
    participant API as Express API
    participant DB as MongoDB
    participant SIO as Socket.io
    participant SMS as Twilio SMS
    participant MAIL as Nodemailer

    rect rgb(219, 234, 254)
        Note over P,MAIL: 1 — Registration & OTP Flow
        P->>FE: Fill registration form
        FE->>API: POST /api/auth/register/initiate
        API->>SMS: Send OTP via Twilio
        API->>MAIL: Send OTP via email
        API-->>FE: { sessionId }
        P->>FE: Enter OTP + complete profile
        FE->>API: POST /api/auth/register/complete
        API->>DB: Create User (isVerified=true)
        API-->>FE: { accessToken, refreshToken, user }
        FE->>FE: Persist to localStorage auth-storage (Zustand)
    end

    rect rgb(220, 252, 231)
        Note over P,SIO: 2 — Patient Joins Queue (Walk-in)
        P->>FE: Click "Join Queue"
        FE->>API: POST /api/queue  (Bearer token)
        API->>DB: Create Queue entry (status=waiting, queueNumber=N)
        API->>DB: Write AuditLog QUEUE_ENTRY_CREATED
        API->>SIO: io.to("role:doctor").emit("queue:new-patient", entry)
        API->>DB: Create Notification for doctor
        SIO-->>D: Realtime event queue:new-patient
        API-->>FE: { queueEntry, position, estimatedWaitTime }
        FE->>FE: Display live queue position
    end

    rect rgb(254, 249, 195)
        Note over D,SIO: 3 — Doctor Calls Next Patient
        D->>FE: Click "Call Next"
        FE->>API: POST /api/queue/call-next
        API->>DB: Update Queue status=in-progress, calledTime=now
        API->>DB: Write AuditLog QUEUE_PATIENT_CALLED
        API->>SIO: io.to("user:patientId").emit("queue:called", { position, room })
        API->>DB: Create Notification (queue_update → patient)
        SIO-->>P: Realtime event queue:called
        FE-->>P: "You are being called — Room 3"
    end

    rect rgb(253, 232, 255)
        Note over D,P: 4 — Consent-Based Medical Record Access
        D->>FE: Request record access for patient
        FE->>API: POST /api/consent (doctor requests)
        API->>DB: Create Consent (status=pending)
        API->>DB: Create Notification consent_request → patient
        API->>SIO: io.to("user:patientId").emit("notification:new", ...)
        SIO-->>P: Realtime consent request notification
        P->>FE: Approve consent
        FE->>API: PATCH /api/consent/:id/grant
        API->>DB: Update Consent (status=active)
        API->>DB: Write AuditLog CONSENT_GRANTED
        API->>SIO: io.to("user:doctorId").emit("notification:new", ...)
        SIO-->>D: Consent granted notification
        D->>FE: View patient records
        FE->>API: GET /api/records?patientId=X
        API->>DB: Verify active Consent exists
        API->>DB: Fetch + decrypt MedicalRecords
        API->>DB: Write AuditLog RECORD_ACCESSED (severity=high)
        API-->>FE: Decrypted record data
    end

    rect rgb(255, 237, 213)
        Note over D,A: 5 — Emergency Access (No Consent)
        D->>FE: Submit emergency access form
        FE->>API: POST /api/emergency-access
        API->>DB: Create EmergencyAccess (status=active, expires=+24h)
        API->>DB: Write AuditLog EMERGENCY_ACCESS_CREATED (severity=critical)
        API->>DB: Create Notification emergency_access → patient + emergency_flagged → admin
        API->>SIO: Emit to patient + admin rooms
        SIO-->>P: Emergency access alert
        SIO-->>A: Flagged for review
        D->>API: GET /api/records (emergency override path)
        API->>DB: Verify EmergencyAccess active + not expired
        API->>DB: Write AuditLog RECORD_ACCESSED (severity=critical)
        A->>FE: Review and audit emergency access
        FE->>API: GET /api/audit?action=EMERGENCY_ACCESS
        API->>DB: Query AuditLog
        API-->>FE: Audit trail
    end

    rect rgb(220, 252, 231)
        Note over D,P: 6 — Prescription & Consultation Completion
        D->>FE: Write prescription
        FE->>API: POST /api/prescriptions
        API->>DB: Create Prescription (medicines, diagnosis, tests)
        API->>DB: Update Queue status=completed, completedTime=now
        API->>DB: Write AuditLog PRESCRIPTION_CREATED
        API->>DB: Create Notification prescription_created → patient
        API->>SIO: io.to("user:patientId").emit("notification:new", ...)
        SIO-->>P: Prescription ready notification
        API->>SIO: io.to("role:doctor").emit("queue:updated", stats)
        SIO-->>D: Queue stats updated in realtime
    end

    rect rgb(219, 234, 254)
        Note over API,MAIL: 7 — Appointment Reminder (node-cron)
        API->>API: node-cron fires at scheduled time
        API->>DB: Find Appointments where date is T+24h and reminderSent24h=false
        API->>MAIL: Send reminder email
        API->>DB: Set reminderSent24h=true
        API->>DB: Create Notification appointment_reminder → patient
    end
```

---

## 4. System Architecture (Component View)

```mermaid
graph TB
    classDef userNode fill:#1e40af,stroke:#93c5fd,color:#ffffff
    classDef feNode fill:#166534,stroke:#86efac,color:#ffffff
    classDef beNode fill:#92400e,stroke:#fcd34d,color:#ffffff
    classDef dbNode fill:#831843,stroke:#f9a8d4,color:#ffffff
    classDef extNode fill:#4c1d95,stroke:#c4b5fd,color:#ffffff

    subgraph USERS["Users"]
        PAT([Patient]):::userNode
        DOC([Doctor]):::userNode
        ADM([Admin]):::userNode
    end

    subgraph FE["Frontend — React 18 + Vite · localhost:5173"]
        ROUTER[React Router v6\nProtectedRoute per role]:::feNode
        ZUSTAND[Zustand Store\nuseAuthStore · notificationStore]:::feNode
        REACTQ[React Query\nServer Cache]:::feNode
        AXIOSC[Axios Instance\nBearer token interceptor]:::feNode
        SOCKC[Socket.io Client\nLive updates]:::feNode
    end

    subgraph BE["Backend — Express · localhost:5000"]
        MWSTACK[helmet · cors · compression\nmorgan · rate-limit]:::beNode
        JWTMW[JWT Middleware\nprotect + authorize roles]:::beNode
        ROUTES[12 Route Groups\nauth · queue · records · consent\nappointments · prescriptions\nadmin · audit · analytics\nnotifications · emergency]:::beNode
        SERVICES[Services\nnotificationService · emailService\nappointmentScheduler cron]:::beNode
        SOCKSERVER[Socket.io Server\nrooms: user · role · dept]:::beNode
        MULTER[Multer Upload\n5 files · 10MB · disk]:::beNode
        AES[AES-256 Encryption\nMedical Records]:::beNode
        AUDITLOG[Audit Logger\nAdmin + HIPAA routes]:::beNode
    end

    subgraph DB["MongoDB — carequeue"]
        COL1[(User\nAppointment · Queue)]:::dbNode
        COL2[(MedicalRecord\nPrescription · Consent)]:::dbNode
        COL3[(EmergencyAccess\nAuditLog · Notification)]:::dbNode
    end

    subgraph EXT["External Services"]
        TWILIO[Twilio\nSMS OTP]:::extNode
        NODEMAILER[Nodemailer\nEmail + Reminders]:::extNode
        DISK[File System\nuploads/medical-records]:::extNode
    end

    USERS --> FE
    AXIOSC -->|HTTPS REST| MWSTACK
    SOCKC <-->|WebSocket| SOCKSERVER
    MWSTACK --> JWTMW --> ROUTES
    ROUTES --> SERVICES
    ROUTES --> MULTER
    ROUTES --> AES
    ROUTES --> AUDITLOG
    ROUTES --> DB
    SERVICES --> SOCKSERVER
    SERVICES --> TWILIO
    SERVICES --> NODEMAILER
    MULTER --> DISK
```

---

## 5. Queue Flow

```mermaid
flowchart TD
    classDef action fill:#1e3a5f,stroke:#60a5fa,color:#ffffff
    classDef state fill:#166534,stroke:#86efac,color:#ffffff
    classDef decision fill:#713f12,stroke:#fbbf24,color:#ffffff
    classDef event fill:#4c1d95,stroke:#c4b5fd,color:#ffffff
    classDef terminal fill:#831843,stroke:#f9a8d4,color:#ffffff

    START([Patient Arrives]):::terminal
    WALKIN{Walk-in or\nAppointment?}:::decision
    BOOK[Book Appointment\nPOST /api/appointments]:::action
    APPT_CONF[status = scheduled]:::state
    REMINDER[node-cron sends\n24h + 1h reminders]:::event
    CHECKIN[Patient checks in\nstatus = checked-in]:::action
    JOIN[Join Queue\nPOST /api/queue]:::action
    CREATED[Queue Entry Created\nstatus = waiting\nqueueNumber = N]:::state
    NOTIFY_DOC[Socket emit to doctor\nqueue:new-patient]:::event
    WAIT[Patient waits\nestimatedWaitTime updated]:::state
    PRIORITY{Priority\nbump?}:::decision
    CALLED[Doctor calls next\nPOST /api/queue/call-next]:::action
    INPROGRESS[status = in-progress\ncalledTime = now]:::state
    NOTIFY_PAT[Socket emit to patient\nqueue:called]:::event
    CONSULT[Patient in Consultation]:::state
    OUTCOME{Consultation\nOutcome}:::decision
    PRESCRIPTION[Write Prescription\nPOST /api/prescriptions]:::action
    COMPLETE[status = completed\ncompletedTime = now]:::state
    NOSHOW[status = no-show]:::state
    CANCEL[status = cancelled]:::state
    NOTIF_RX[Notification → patient\nprescription_created]:::event
    STATS[Socket emit to doctor\nqueue:updated stats]:::event
    END([Queue Entry Closed]):::terminal

    START --> WALKIN
    WALKIN -->|Walk-in| JOIN
    WALKIN -->|Appointment| BOOK
    BOOK --> APPT_CONF --> REMINDER --> CHECKIN --> JOIN
    JOIN --> CREATED --> NOTIFY_DOC --> WAIT
    WAIT --> PRIORITY
    PRIORITY -->|Yes - Urgent/Emergency| CALLED
    PRIORITY -->|Normal - keep waiting| WAIT
    CALLED --> INPROGRESS --> NOTIFY_PAT --> CONSULT
    CONSULT --> OUTCOME
    OUTCOME -->|Prescription written| PRESCRIPTION --> COMPLETE --> NOTIF_RX --> STATS --> END
    OUTCOME -->|No-show| NOSHOW --> END
    OUTCOME -->|Cancelled| CANCEL --> END
```

---

## 6. Health Vault Flow

```mermaid
flowchart TD
    classDef action fill:#1e3a5f,stroke:#60a5fa,color:#ffffff
    classDef state fill:#166534,stroke:#86efac,color:#ffffff
    classDef decision fill:#713f12,stroke:#fbbf24,color:#ffffff
    classDef event fill:#4c1d95,stroke:#c4b5fd,color:#ffffff
    classDef terminal fill:#831843,stroke:#f9a8d4,color:#ffffff
    classDef deny fill:#7f1d1d,stroke:#fca5a5,color:#ffffff

    UPLOAD([Patient Uploads Record]):::terminal
    MULTER[POST /api/records\nMultipart · 5 files · 10MB]:::action
    ENCRYPT[AES-256 Encrypt\nwith ENCRYPTION_KEY]:::action
    SAVE[(MedicalRecord saved\nto MongoDB)]:::state
    AUDIT_CREATE[AuditLog: RECORD_CREATED]:::event

    DOCTOR([Doctor Needs Records]):::terminal
    CHECK_CONSENT{Active Consent\nexists?}:::decision
    CHECK_EMERGENCY{Emergency\nsituation?}:::decision

    REQ_CONSENT[POST /api/consent\nRequest consent from patient]:::action
    NOTIF_PATIENT[Notification to patient\nconsent_request]:::event
    PAT_DECISION{Patient\nDecision}:::decision
    GRANT[PATCH /api/consent/:id/grant\nstatus = active]:::action
    DENY_ACCESS[Access Denied\n403 Forbidden]:::deny
    NOTIF_DOCTOR[Notification to doctor\nconsent_granted]:::event

    EMERGENCY[POST /api/emergency-access\nwith justification + emergencyType]:::action
    EA_CREATED[EmergencyAccess created\nstatus = active · expires = +24h]:::state
    NOTIF_EA[Notify patient: emergency_access\nNotify admin: emergency_flagged]:::event

    FETCH[GET /api/records]:::action
    VERIFY{Consent OR\nEmergency valid?}:::decision
    DECRYPT[Fetch + Decrypt Records\nAES-256]:::action
    AUDIT_ACCESS[AuditLog: RECORD_ACCESSED\nseverity = high / critical]:::event
    VIEW([Doctor Views Records]):::terminal

    ADMIN([Admin Reviews]):::terminal
    AUDIT_QUERY[GET /api/audit\nEmergency access logs]:::action
    ADMIN_DECISION{Action\nneeded?}:::decision
    REVOKE[PATCH /api/emergency-access/:id/revoke\nstatus = revoked]:::action
    REVIEWED[EmergencyAccess marked reviewed]:::state
    AUDIT_END([Audit Trail Complete]):::terminal

    UPLOAD --> MULTER --> ENCRYPT --> SAVE --> AUDIT_CREATE
    DOCTOR --> CHECK_CONSENT
    CHECK_CONSENT -->|Yes| FETCH
    CHECK_CONSENT -->|No| CHECK_EMERGENCY
    CHECK_EMERGENCY -->|No| REQ_CONSENT
    CHECK_EMERGENCY -->|Yes| EMERGENCY

    REQ_CONSENT --> NOTIF_PATIENT --> PAT_DECISION
    PAT_DECISION -->|Grant| GRANT --> NOTIF_DOCTOR --> FETCH
    PAT_DECISION -->|Deny| DENY_ACCESS

    EMERGENCY --> EA_CREATED --> NOTIF_EA --> FETCH

    FETCH --> VERIFY
    VERIFY -->|Valid| DECRYPT --> AUDIT_ACCESS --> VIEW
    VERIFY -->|Invalid| DENY_ACCESS

    ADMIN --> AUDIT_QUERY --> ADMIN_DECISION
    ADMIN_DECISION -->|Revoke| REVOKE --> AUDIT_END
    ADMIN_DECISION -->|Approve| REVIEWED --> AUDIT_END
```
