# Admin Dashboard Screens

Complete documentation for admin-facing application screens.

---

## Screen Overview

1. Admin Dashboard
2. Audit Logs
3. Emergency Access Review
4. User Management
5. Analytics Dashboard
6. System Settings
7. Queue Statistics

---

## Key Features

### 1. Admin Dashboard

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│ CareQueue Admin          [Search]      Admin  [🔔(12)]     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ System Health Cards                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ 🟢 API   │ │ 🟢 DB    │ │ 🟡 Queue │ │ 🟢 Socket│      │
│ │ Online   │ │ Online   │ │ Warning  │ │ Online   │      │
│ │ 99.8%    │ │ Healthy  │ │ 2 stale  │ │ 145 conn │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│ 🚨 Emergency Access Alerts (3 Pending Reviews)             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🚨 HIGH | Dr. Sharma | Emergency Override            │   │
│ │ Patient: Rajesh Kumar | Time: 10:45 AM                │   │
│ │ Status: Pending Admin Review | [Review Now]          │   │
│ ├─────────────────────────────────────────────────────┤   │
│ │ 🚨 MED | Dr. Patel | Emergency Override              │   │
│ │ Patient: Priya Singh | Time: 09:30 AM                 │   │
│ │ Status: Pending Admin Review | [Review Now]          │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Recent Activity Logs                   Queue Statistics     │
│ [View All Logs]                        [View Analytics]     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 2. Audit Logs

**Search & Filter Interface:**
```
┌────────────────────────────────────────────────────────────┐
│ 🔍 Audit Logs                                              │
├────────────────────────────────────────────────────────────┤
│ [Search: User/Patient/Action]  [Date Range▾]  [Action▾]   │
│ [User Role▾]  [Severity▾]  [Export CSV]                   │
├────────────────────────────────────────────────────────────┤
│ Date/Time    │ User        │ Action      │ Patient │ IP   │
│─────────────────────────────────────────────────────────  │
│ 2024-01-15   │ Dr. Sharma  │ 🚨 Emergency│ Rajesh  │ 192..│
│ 10:45:23 AM  │ (Doctor)    │ Override    │ Kumar   │ [↗]  │
│─────────────────────────────────────────────────────────  │
│ 2024-01-15   │ Priya Singh │ ✅ Login    │ Self    │ 192..│
│ 10:42:10 AM  │ (Patient)   │             │         │ [↗]  │
│─────────────────────────────────────────────────────────  │
│ 2024-01-15   │ Admin User  │ 🔧 User     │ N/A     │ 192..│
│ 10:30:15 AM  │ (Admin)     │ Created     │         │ [↗]  │
├────────────────────────────────────────────────────────────┤
│ Showing 1-50 of 1,234  [◀] [1] [2] [3]...[25] [▶]        │
└────────────────────────────────────────────────────────────┘
```

**Log Detail Drawer:**
- Full event details
- User session information
- Request/Response data (for API calls)
- Location/Device info
- Timeline of related actions

### 3. Emergency Access Review

**Pending Reviews List:**
```
┌────────────────────────────────────────────────────────────┐
│ 🚨 Emergency Access Reviews                               │
├────────────────────────────────────────────────────────────┤
│ Filters: [Status▾] [Priority▾] [Date Range▾]             │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ 🚨 HIGH PRIORITY - Requires immediate review               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Doctor: Dr. Sharma | ID: D-1234                      │   │
│ │ Patient: Rajesh Kumar | ID: P-5678                   │   │
│ │ Time: 10:45 AM | Duration: 15 minutes                │   │
│ │ Type: Cardiac Emergency                               │   │
│ │ Records Accessed: 8 files                             │   │
│ │ Status: 🔴 Pending Review (2 hours ago)              │   │
│ │                                           [Review Now]│   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ 🟡 MEDIUM PRIORITY                                         │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Doctor: Dr. Patel | Patient: Priya Singh            │   │
│ │ Time: 09:30 AM | Type: Severe Trauma                 │   │
│ │ Status: 🟡 Under Review (by Admin B)                │   │
│ └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

**Detailed Review Screen:**
```
┌────────────────────────────────────────────────────────────┐
│ 🚨 Emergency Access Review                        [Close X]│
├────────────────────────────────────────────────────────────┤
│ Status: PENDING REVIEW | Priority: HIGH                    │
│                                                             │
│ Doctor Information                  Patient Information    │
│ Name: Dr. Amit Sharma              Name: Rajesh Kumar      │
│ ID: D-1234                         ID: P-5678              │
│ Specialty: Cardiology              Age: 45 | Gender: M     │
│ License: MH/MED/12345              Contact: +91-9876543210│
│                                                             │
│ Emergency Details                                          │
│ Time: 2024-01-15 10:45:23 AM                              │
│ Type: Cardiac Emergency                                    │
│ Duration: 15 minutes                                       │
│ Location: Cabin 3, Cardiology                             │
│                                                             │
│ Records Accessed (8 total)                                │
│ • Medical History (Cardiac)                                │
│ • Previous ECG Reports (3)                                 │
│ • Lab Reports - Lipid Profile                             │
│ • Prescription History                                     │
│ • Allergy Information                                      │
│ [View Full List]                                           │
│                                                             │
│ Doctor's Justification                                     │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Patient presented with severe chest pain and        │   │
│ │ breathing difficulty. Suspected cardiac event.      │   │
│ │ Required immediate access to cardiac history and    │   │
│ │ allergy information for emergency treatment.        │   │
│ │ Patient unconscious, unable to provide consent.     │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Witness: Nurse Pooja (Staff ID: N-789)                    │
│                                                             │
│ Timeline                                                   │
│ 10:45:00 AM - Emergency override initiated                │
│ 10:45:23 AM - Access granted (auto)                       │
│ 10:45:30 AM - Patient records accessed                    │
│ 10:47:15 AM - Treatment notes added                       │
│ 11:00:00 AM - Access session ended                        │
│ 11:01:00 AM - Patient notified (auto)                     │
│                                                             │
│ Admin Verification Checklist                               │
│ [ ] Emergency situation verified                           │
│ [ ] Doctor credentials verified                            │
│ [ ] Justification adequate                                 │
│ [ ] Records accessed appropriate                           │
│ [ ] No policy violations detected                          │
│                                                             │
│ Review Decision                                            │
│ [Radio] ✅ Approve - Legitimate emergency                  │
│ [Radio] ❌ Reject - Insufficient justification             │
│ [Radio] ⚠️ Flag - Requires investigation                   │
│                                                             │
│ Admin Comments *                                           │
│ [Text area for review notes]                              │
│                                                             │
│ [Cancel]  [Submit Review]                                  │
└────────────────────────────────────────────────────────────┘
```

### 4. User Management

**User List:**
```
┌────────────────────────────────────────────────────────────┐
│ 👥 User Management                    [+ Add User]         │
├────────────────────────────────────────────────────────────┤
│ [Search]  [Role▾]  [Status▾]  [Department▾]              │
├────────────────────────────────────────────────────────────┤
│ Name          │ Role    │ Status  │ Dept      │ Actions  │
│─────────────────────────────────────────────────────────  │
│ Dr. Sharma    │ Doctor  │ 🟢Active│ Cardio    │ [⋮]      │
│ ID: D-1234    │         │         │           │          │
│─────────────────────────────────────────────────────────  │
│ Rajesh Kumar  │ Patient │ 🟢Active│ N/A       │ [⋮]      │
│ ID: P-5678    │         │         │           │          │
│─────────────────────────────────────────────────────────  │
│ Admin User    │ Admin   │ 🟢Active│ Admin     │ [⋮]      │
│ ID: A-9012    │         │         │           │          │
└────────────────────────────────────────────────────────────┘
```

**Add User Modal:**
- Role selection (Patient/Doctor/Admin)
- Personal information
- Contact details
- For Doctors: License, specialty, department
- Generate credentials option
- Send welcome email toggle

**Edit User:**
- Personal info (tab)
- Role & permissions (tab)
- Activity history (tab)
- Security settings (tab)

### 5. Analytics Dashboard

**Summary Metrics:**
```
┌────────────────────────────────────────────────────────────┐
│ 📊 Analytics Dashboard         [Today▾] [Export Report]   │
├────────────────────────────────────────────────────────────┤
│ Summary Metrics                                            │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐│
│ │ 156 Total  │ │ 12.5 min   │ │ 98.5%      │ │ 45 min   ││
│ │ Patients   │ │ Avg Wait   │ │ Completion │ │ Peak Wait││
│ │ Today      │ │ Time       │ │ Rate       │ │ Time     ││
│ └────────────┘ └────────────┘ └────────────┘ └──────────┘│
│                                                             │
│ Wait Time Trends (Last 7 Days)                            │
│ [Line Chart showing wait time trends]                     │
│                                                             │
│ Doctor Utilization                                         │
│ [Horizontal Bar Chart]                                     │
│ Dr. Sharma    ████████████████████░░ 85%                  │
│ Dr. Patel     ███████████████░░░░░░░ 70%                  │
│ Dr. Verma     ██████████████████░░░░ 80%                  │
│                                                             │
│ Peak Hours Analysis                                        │
│ [Heatmap showing busy hours]                              │
│                                                             │
│ Department Performance                                     │
│ Cardiology:    125 patients | 10 min avg wait            │
│ Orthopedics:    89 patients | 15 min avg wait            │
│ General:       156 patients |  8 min avg wait            │
└────────────────────────────────────────────────────────────┘
```

### 6. System Settings

**Categories:**
- General Settings (hospital info, timezone)
- Queue Configuration (max tokens, reset time)
- Notification Settings (SMS, email, push)
- Security Settings (MFA, session timeout, password policy)
- Backup & Recovery
- API Keys & Integrations

### 7. Queue Statistics

**Real-time Overview:**
- Current active queues by department
- Average wait times
- Longest waiting patient alert
- Stale tokens (>2 hours)
- Doctor availability status
- Queue pause reasons

---

## Admin Navigation

**Side Navigation:**
- 🏠 Dashboard
- 🔍 Audit Logs
- 🚨 Emergency Reviews
- 👥 Users
- 📊 Analytics
- ⏱️ Queue Stats
- ⚙️ Settings

---

## Security Features

### Role-Based Access
- **Super Admin**: Full system access
- **Admin**: User management + reviews
- **Auditor**: Read-only audit logs

### Audit Trail
- All admin actions logged
- IP tracking
- Session recording
- Export capabilities

### Emergency Protocol
- 24-hour review window
- Escalation for delayed reviews
- Automatic patient notification
- Monthly compliance reports

---

## Export & Reporting

### Available Reports
- Daily queue statistics
- Emergency access summary
- User activity report
- System health report
- Compliance audit trail

### Export Formats
- CSV (for Excel)
- PDF (formatted reports)
- JSON (for API integration)

---

**End of Admin Screens Documentation**

For detailed layouts and ASCII diagrams, refer to the full conversation history or request specific screen details.
