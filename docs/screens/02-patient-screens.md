# Patient App Screens

Complete documentation for patient-facing application screens.

---

## Screen Overview

1. [Patient Dashboard](#1-patient-dashboard)
2. [Profile Dropdown](#2-profile-dropdown)
3. [Notifications Panel](#3-notifications-panel)
4. [Appointment Booking Flow](#4-appointment-booking-flow) (6 steps)
5. [Live Queue Tracking](#5-live-queue-tracking)
6. [Queue - Called State](#6-queue-called-state)
7. [Health Vault](#7-health-vault)
8. [Record Detail View](#8-record-detail-view)
9. [Upload Record](#9-upload-record)
10. [Consent Management](#10-consent-management)
11. [Emergency Access Alert](#11-emergency-access-alert)

---

## 1. Patient Dashboard

### Purpose
Main landing page showing current status, quick actions, and overview.

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│ [Logo] CareQueue        [🔍]  [🔔(3)]  [Profile ▾]             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Good Morning, Rajesh 👋                                       │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🎫 YOUR CURRENT TOKEN                                   │ │
│  │         TOKEN: A-42                                       │ │
│  │    Queue Position: 5th                                   │ │
│  │    Estimated Wait: 15 mins                               │ │
│  │    Status: [🟡 Waiting]                                  │ │
│  │    Dr. Sharma - Cardiology                               │ │
│  │    Today, 10:30 AM                                       │ │
│  │    [View Queue Details]                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│  │  📅 Book         │ │  📁 Health       │ │  ⏱️ Join        │ │
│  │  Appointment     │ │  Records         │ │  Queue          │ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ │
│                                                                │
│  Upcoming Appointments                          [View All]    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📅 Jan 25 - 2:30 PM  |  Dr. Patel - General Checkup    │ │
│  │  Token: B-15          |  [View Details] [Cancel]        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  Recent Activity                                [View All]    │
│  │  • Dr. Sharma accessed your ECG report - 2 hours ago    │ │
│  │  • Lab results uploaded - Yesterday                     │ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Components

**Top Navigation:**
- Logo (left)
- Search bar
- Notifications badge
- Profile dropdown

**Hero Card - Current Token:**
- Large token number
- Queue position
- Wait time estimate
- Status badge
- Doctor + department
- Date/time
- View Queue button

**Quick Actions (3 cards):**
- Book Appointment
- Health Records
- Join Queue

**Upcoming Appointments:**
- List view with cards
- Actions per appointment

**Recent Activity:**
- Timeline view
- Activity items with timestamps

### States

**Empty States:**
- No active token: "No active queue token" + "Join Queue" CTA
- No appointments: "No upcoming appointments. Book one now!"
- No activity: "No recent activity"

**Status Badge Colors:**
- 🟡 Waiting (amber)
- 🟢 Called (green)
- 🔵 In Progress (blue)
- ⚪ Completed (gray)

---

## 2. Profile Dropdown

### Layout
```
┌──────────────────────────┐
│  Rajesh Kumar            │
│  Patient ID: P-00123     │
│  rajesh@email.com        │
├──────────────────────────┤
│  My Profile              │
│  Settings                │
│  Help & Support          │
├──────────────────────────┤
│  🔐 Security             │
│  📱 Devices              │
├──────────────────────────┤
│  🚪 Logout               │
└──────────────────────────┘
```

### Menu Items
- My Profile → Profile editing
- Settings → App preferences
- Help & Support → FAQ/Contact
- Security → Password, MFA
- Devices → Active sessions
- Logout → Sign out

---

## 3. Notifications Panel

### Layout
```
┌─────────────────────────────────────────┐
│  Notifications          [Mark all read] │
├─────────────────────────────────────────┤
│  🟢 Your token A-42 is ready            │
│     Dr. Sharma is ready to see you      │
│     2 mins ago                 [View]   │
├─────────────────────────────────────────┤
│  🔵 Access Request                      │
│     Dr. Patel requested access to       │
│     your X-ray reports                  │
│     1 hour ago        [Grant] [Deny]    │
├─────────────────────────────────────────┤
│  ⚪ Appointment Confirmed               │
│     Your appointment with Dr. Singh     │
│     is confirmed for Jan 28             │
│     Yesterday                  [View]   │
└─────────────────────────────────────────┘
```

### Notification Categories
- 🟢 Green: Queue updates (urgent)
- 🔵 Blue: Access requests (action needed)
- 🟡 Amber: Reminders
- ⚪ Gray: General info (read)

### Actions
- Mark as read
- Quick actions (Grant/Deny/View)
- Mark all as read
- Clear notifications

---

## 4. Appointment Booking Flow

### Step 1: Select Department
```
┌────────────────────────────────────────────────────────────────┐
│ [←] Book Appointment              [🔍 Search departments...]    │
├────────────────────────────────────────────────────────────────┤
│  Step 1 of 6: Select Department                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │   🫀          │ │   🦴          │ │   👁️          │          │
│  │  Cardiology  │ │ Orthopedics  │ │ Ophthalmology│          │
│  │  8 Doctors   │ │  5 Doctors   │ │  6 Doctors   │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                                │
│  [9 more departments...]                                       │
└────────────────────────────────────────────────────────────────┘
```

### Step 2: Select Doctor
```
┌────────────────────────────────────────────────────────────────┐
│ [←] Cardiology                       [🔍 Search doctors...]     │
├────────────────────────────────────────────────────────────────┤
│  Step 2 of 6: Select Doctor                                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  [👨‍⚕️]  Dr. Amit Sharma                                    │ │
│  │         MBBS, MD - Cardiology | 15 years                 │ │
│  │         ⭐ 4.8 (234 reviews)                              │ │
│  │         🕒 Next: Today, 2:00 PM                           │ │
│  │         [View Profile] [Select]                          │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Step 3: Select Date
```
┌────────────────────────────────────────────────────────────────┐
│  Step 3 of 6: Select Date                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  January 2026                           [◀] [January] [▶]      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Sun   Mon   Tue   Wed   Thu   Fri   Sat                 │ │
│  │       1     2     3     4     5     6                     │ │
│  │              ❌    ❌    ✅    ✅    ❌                      │ │
│  │  [Calendar continues...]                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│  Legend: ✅ Available  ❌ Not Available  🔵 Today              │
└────────────────────────────────────────────────────────────────┘
```

### Step 4: Select Time
```
┌────────────────────────────────────────────────────────────────┐
│  Step 4 of 6: Select Time                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  Morning                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │  9:00 AM │ │  9:30 AM │ │ 10:00 AM │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
│                                                                │
│  Afternoon                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│  │  2:00 PM │ │  2:30 PM │ │  3:00 PM │                      │
│  └──────────┘ └──────────┘ └──────────┘                      │
└────────────────────────────────────────────────────────────────┘
```

### Step 5: Review & Confirm
```
┌────────────────────────────────────────────────────────────────┐
│  Step 5 of 6: Confirm Details                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  📅 Appointment Details                              [Edit]    │
│  Department: Cardiology                                        │
│  Doctor: Dr. Amit Sharma                                       │
│  Date: Tuesday, January 21, 2026                               │
│  Time: 2:00 PM - 2:30 PM                                       │
│                                                                │
│  👤 Patient Information                         [Edit Profile] │
│  Name: Rajesh Kumar                                            │
│  Phone: +91 98765 43210                                        │
│                                                                │
│  📝 Reason for Visit (Optional)                                │
│  [Text area for symptoms/reason]                               │
│                                                                │
│  [Cancel]              [Confirm Booking]                       │
└────────────────────────────────────────────────────────────────┘
```

### Step 6: Success
```
┌────────────────────────────────────────────────────────────────┐
│                      ✅                                        │
│           Appointment Booked Successfully!                     │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Your Token Number                            │ │
│  │                   A - 4 2                                 │ │
│  │  ────────────────────────────────────────────────────   │ │
│  │  Dr. Amit Sharma - Cardiology                            │ │
│  │  Tuesday, January 21, 2026 at 2:00 PM                    │ │
│  │  You are currently: 5th in queue                         │ │
│  │  Estimated wait: 15 minutes                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  📧 Confirmation sent to rajesh@email.com                     │
│  📱 SMS sent to +91 98765 43210                               │
│                                                                │
│  [View Live Queue]    [Add to Calendar]                        │
│  [Back to Dashboard]                                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Live Queue Tracking

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│ [←] Live Queue                              🔄 Last updated: 2s│
├────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🎫 YOUR TOKEN: A-42                                     │ │
│  │     Queue Position: 5th                                  │ │
│  │     Estimated Wait: 15 mins                              │ │
│  │     Status: [🟡 Waiting]                                 │ │
│  │     Dr. Sharma - Cardiology                              │ │
│  │     Today, 2:00 PM                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  Queue Status                                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  🟢 A-38 | In Progress with doctor                       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  🟡 A-39 | Next in line                                  │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  🟡 A-40 | Waiting                                       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  🔵 A-42  ← YOU ARE HERE | Waiting                       │ │
│  ├─────────────────────────────────────────────────────────┤ │
│  │  ⚪ A-43 | Waiting                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Cancel Appointment]                                          │
└────────────────────────────────────────────────────────────────┘
```

### Features
- Auto-refresh (WebSocket)
- Real-time position updates
- Smooth animations
- Sound/vibration when called

---

## 6. Queue - Called State

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│                      🔔                                        │
│              YOU'VE BEEN CALLED!                               │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Token: A-42                                  │ │
│  │  Dr. Sharma is ready to see you now                      │ │
│  │  Please proceed to: Room 305, 3rd Floor                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  [I'm On My Way]                                               │
│  [View Directions]                                             │
└────────────────────────────────────────────────────────────────┘
```

### Behavior
- Full-screen takeover
- Sound notification
- Vibration (mobile)
- Push notification if backgrounded

---

## 7. Health Vault

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│ [←] Health Vault                [🔍 Search] [+ Upload Record]  │
├────────────────────────────────────────────────────────────────┤
│  [All Records ▾]  [Filter by Type ▾]  [Sort: Newest First ▾]  │
│                                                                │
│  📅 January 18, 2026                                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  📄 ECG Report                          [🔒]             │ │
│  │  Uploaded by: Dr. Sharma | Cardiology                    │ │
│  │  File: ecg_report_jan18.pdf (2.3 MB)                     │ │
│  │  [View] [Download] [Share]                               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  💊 Prescription                        [🔒]             │ │
│  │  Prescribed by: Dr. Sharma                               │ │
│  │  Medications: Aspirin 75mg, Metoprolol 50mg              │ │
│  │  [View] [Download]                                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Record Types
- 📄 Lab Reports
- 💊 Prescriptions
- 🩸 Blood Tests
- 🔬 X-rays/Scans
- 📋 Doctor Notes
- 💉 Vaccination Records

### Features
- Search functionality
- Filter by type/date
- Sort options
- Preview files
- Download records
- Share with doctors
- Access history per record

---

## 8. Record Detail View

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│ [←] ECG Report                                          [✕]    │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │   [PDF Preview]      │  │  📄 ECG Report               │  │
│  │                      │  │  Date: January 18, 2026       │  │
│  │                      │  │  Uploaded by: Dr. Sharma      │  │
│  │                      │  │  Size: 2.3 MB                 │  │
│  │                      │  │  🔒 Encrypted & Secure        │  │
│  │                      │  │                               │  │
│  │                      │  │  Access History (3)           │  │
│  │                      │  │  • Dr. Sharma (Uploaded)      │  │
│  │                      │  │    Jan 18, 2:45 PM            │  │
│  │                      │  │  • Dr. Patel (Viewed)         │  │
│  │                      │  │    Jan 19, 10:20 AM           │  │
│  │                      │  │  • You (Viewed)               │  │
│  │                      │  │    Jan 20, 9:15 AM            │  │
│  └──────────────────────┘  │                               │  │
│                            │  [Download]  [Share]          │  │
│                            └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. Upload Record

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Upload Medical Record                              [✕]    │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────┐   │
│  │  📁 Drag and drop files here or [Browse Files]     │   │
│  │  Supported: PDF, JPG, PNG (Max 10 MB)              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  Record Type *                                              │
│  [Select type ▾]                                            │
│                                                             │
│  Title *                                                    │
│  [e.g., Blood Test Results]                                 │
│                                                             │
│  Date *                                                     │
│  [MM/DD/YYYY]                                               │
│                                                             │
│  Notes (Optional)                                           │
│  [Text area]                                                │
│                                                             │
│  [Cancel]              [Upload]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Consent Management

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│ [←] Access Management                                          │
├────────────────────────────────────────────────────────────────┤
│  [Pending Requests (2)] [Active Permissions] [Access History] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  🔵 New Access Request                                         │
│  Dr. Priya Patel (Cardiology)                                  │
│  Requested access to: X-ray Reports (Chest)                    │
│  Reason: Required for treatment planning                       │
│  Requested: 1 hour ago                                         │
│  [View Doctor Profile]                                         │
│  [✅ Grant Access]  [❌ Deny]                                  │
└────────────────────────────────────────────────────────────────┘
```

### Tabs

**Pending Requests:**
- New access requests
- Doctor information
- Requested records
- Justification
- Grant/Deny actions

**Active Permissions:**
- Currently granted access
- Which records
- Last accessed
- Revoke option

**Access History:**
- Past access events
- Who, when, what
- Emergency overrides

---

## 11. Emergency Access Alert

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  🚨 EMERGENCY ACCESS ALERT                                  │
│                                                             │
│  Your medical records were accessed using                   │
│  emergency override by:                                     │
│                                                             │
│  Dr. Singh (Emergency Department)                           │
│  January 17, 2026 at 11:45 PM                               │
│                                                             │
│  Records Accessed: All Medical Records                      │
│                                                             │
│  Justification:                                             │
│  "Patient brought in unconscious after accident.            │
│  Immediate access required for life-saving treatment."      │
│                                                             │
│  Status: ✅ Verified by Admin (Dr. Mehta)                   │
│                                                             │
│  [Report Concern] [Contact Admin]                           │
│  [I Understand]                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Design Specifications

### Responsive Breakpoints
- Desktop: 1440px+
- Tablet: 768px - 1439px
- Mobile: < 768px

### Animation Guidelines
- Transition: 200ms ease
- Hover states: subtle
- Loading: skeleton screens
- Success: checkmark animation

### Accessibility
- Keyboard navigation
- ARIA labels
- Focus indicators
- Screen reader support
- High contrast mode

---

**End of Patient Screens Documentation**
