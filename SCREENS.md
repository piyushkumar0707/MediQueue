# MediQueue — Complete Screens Reference
### For Google Stitch UI Generation

**Product:** CareQueue + Health-Vault (branded as "MediQueue")  
**Type:** Healthcare SaaS — Real-time patient queue management + encrypted medical records  
**Roles:** Patient · Doctor · Admin  
**Platform:** Web (responsive) — Desktop primary, mobile supported

---

## Design System

### Brand Identity
- **App Name:** MediQueue
- **Tagline:** "Queue Smarter. Care Better."
- **Logo:** Present in top-left of all layouts
- **Tone:** Clinical-trustworthy meets modern-accessible

### Color Palette
| Token | Color | Usage |
|---|---|---|
| Primary | Indigo `#4F46E5` | Buttons, active states, links |
| Primary Light | `#EEF2FF` | Backgrounds, badges |
| Success | Green `#16A34A` | Confirmed, completed, online |
| Warning | Amber `#D97706` | Waiting, caution, medium priority |
| Danger | Red `#DC2626` | Emergency, errors, cancel |
| Info | Blue `#2563EB` | In-progress, informational |
| Neutral | Gray `#6B7280` | Secondary text, borders |
| Background | `#F9FAFB` | Page backgrounds |
| Surface | `#FFFFFF` | Cards, panels |

### Typography
- **Font Family:** Inter (sans-serif)
- **H1:** 30px / 700 weight — Page titles
- **H2:** 24px / 600 weight — Section headers
- **H3:** 18px / 600 weight — Card titles
- **Body:** 14–16px / 400 weight — Content
- **Small:** 12px / 400 weight — Captions, metadata
- **Label:** 12px / 500 weight uppercase — Form labels, tags

### Spacing & Layout
- Border radius: 8px (cards), 6px (buttons), 4px (badges)
- Max content width: 1280px
- Card shadow: `0 1px 3px rgba(0,0,0,0.1)`
- Patient layout: Top navbar + full-width content
- Doctor/Admin layout: Left sidebar (240px) + content area

### Component Library (Lucide Icons used)
- All icons from Lucide React
- Primary button: Indigo bg, white text, hover darken
- Secondary button: White bg, gray border, hover gray bg
- Danger button: Red bg, white text
- Input: White bg, gray-300 border, focus indigo ring
- Badge/Pill: Rounded-full, color-coded by status
- Toast notifications: top-right, 3s auto-dismiss

---

## Navigation Structure

### Patient — Top Navbar
```
[Logo]  Dashboard | Appointments | Queue | Health Vault | Consent | Prescriptions  [🔔] [Profile]
```

### Doctor — Left Sidebar
```
[Logo] MediQueue
       Doctor Portal
──────────────────
🏠 Dashboard
⏱  Queue Management
📅 Appointments
📁 Shared Records
💊 Prescriptions
🚨 Emergency Access
──────────────────
👤 Profile
❓ Help
🚪 Logout
```

### Admin — Left Sidebar
```
[Logo] MediQueue
       Admin Portal
──────────────────
🏠 Dashboard
📜 Audit Logs
🚨 Emergency Cases
🛡  Emergency Access
👥 User Management
📊 Analytics
──────────────────
👤 Profile
❓ Help
🚪 Logout
```

---

## Route Map

| Screen | URL Path | Role |
|---|---|---|
| Login | `/login` | Public |
| Register | `/register` | Public |
| OTP Verify | `/verify-otp` | Public |
| Forgot Password | `/forgot-password` | Public |
| Reset Password | `/reset-password` | Public |
| Patient Dashboard | `/patient` | Patient |
| Join Queue | `/patient/queue/join` | Patient |
| Queue Tracking | `/patient/queue` | Patient |
| Appointments | `/patient/appointments` | Patient |
| Book Appointment | `/patient/appointments/book` | Patient |
| Health Vault | `/patient/records` | Patient |
| Consent Management | `/patient/consent` | Patient |
| Prescriptions | `/patient/prescriptions` | Patient |
| Doctor Dashboard | `/doctor` | Doctor |
| Queue Management | `/doctor/queue` | Doctor |
| Doctor Appointments | `/doctor/appointments` | Doctor |
| Patient Records | `/doctor/patients/:id/records` | Doctor |
| Shared Records | `/doctor/shared-records` | Doctor |
| Create Prescription | `/doctor/prescriptions/create` | Doctor |
| Prescriptions List | `/doctor/prescriptions` | Doctor |
| Emergency Requests | `/doctor/emergency-requests` | Doctor |
| Admin Dashboard | `/admin` | Admin |
| User Management | `/admin/users` | Admin |
| Audit Logs | `/admin/audit` | Admin |
| Emergency Cases | `/admin/emergency-cases` | Admin |
| Emergency Access Review | `/admin/emergency-access` | Admin |
| Analytics | `/admin/analytics` | Admin |
| Profile | `/:role/profile` | All |
| Help | `/:role/help` | All |
| Notifications | `/:role/notifications` | All |

---

---

# SECTION 1 — AUTHENTICATION SCREENS

---

## Screen A1 — Login

**URL:** `/login`  
**Access:** Public (unauthenticated only)  
**Purpose:** Primary entry point — email/phone + password authentication

### Layout
```
┌────────────────────────────────────────────────────────────┐
│                  [Logo]  MediQueue                         │
│               Secure Healthcare Operations                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│              ┌──────────────────────────────────┐         │
│              │         Welcome Back              │         │
│              │  Sign in to your account          │         │
│              │                                   │         │
│              │  ┌────────────────────────────┐  │         │
│              │  │ 📧 Email or Phone Number    │  │         │
│              │  └────────────────────────────┘  │         │
│              │                                   │         │
│              │  ┌────────────────────────────┐  │         │
│              │  │ 🔒 Password          [👁]   │  │         │
│              │  └────────────────────────────┘  │         │
│              │                                   │         │
│              │              [Forgot Password?]   │         │
│              │                                   │         │
│              │  ┌────────────────────────────┐  │         │
│              │  │       Sign In →             │  │         │
│              │  └────────────────────────────┘  │         │
│              │                                   │         │
│              │  Don't have an account?           │         │
│              │  [Create Account] · [Contact Admin]│        │
│              └──────────────────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Components
- Full-page centered layout, white background or subtle gradient
- Centered card (max-width: 420px), soft shadow
- Logo + App name at top of card
- Email/phone input with mail icon
- Password input with eye toggle
- "Forgot Password?" — right-aligned link, small text
- Primary CTA button: "Sign In" (full-width, indigo)
- Footer links: Register + Contact Admin

### States & Variations
| State | Behavior |
|---|---|
| Default | Empty form |
| Typing | Real-time format hint (email vs phone) |
| Loading | Button disabled + spinner, inputs disabled |
| Validation Error | Red border + error message below field |
| Auth Failed | Toast error "Invalid credentials" |
| Success | Redirect to role-based dashboard |

### Workflow
```
User enters credentials → Submit → Backend validates JWT →
  If Patient → /patient
  If Doctor  → /doctor
  If Admin   → /admin
  If Error   → Show toast error
```

---

## Screen A2 — Register

**URL:** `/register`  
**Access:** Public  
**Purpose:** New patient self-registration (Step 1 of 2)

### Layout
```
┌────────────────────────────────────────────────────────────┐
│              [←]  Create Account                           │
│                                                            │
│        ┌────────────────────────────────────────┐         │
│        │          Join MediQueue                 │         │
│        │   Start managing your health today      │         │
│        │                                         │         │
│        │  First Name         Last Name           │         │
│        │  ┌──────────────┐  ┌──────────────┐   │         │
│        │  │               │  │               │  │         │
│        │  └──────────────┘  └──────────────┘   │         │
│        │                                         │         │
│        │  Email Address                          │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │  Phone Number                           │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │  Password              [👁]             │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │  Confirm Password      [👁]             │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │  Password Strength ████████░░░  Strong  │         │
│        │  ✓ 8+ chars  ✓ Uppercase  ✓ Number     │         │
│        │                                         │         │
│        │  ☐ I agree to Terms & Privacy Policy   │         │
│        │                                         │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  │     Create Account →              │  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │  Already have an account? [Sign In]     │         │
│        └────────────────────────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Components
- Back button (top-left)
- First + Last name inputs (side-by-side on desktop)
- Email input
- Phone input
- Password input with strength meter
- Confirm password input
- Live password requirement checklist (✓/○)
- Terms & Privacy checkbox
- Submit button
- Sign in link

### Password Strength Meter
- Levels: Weak → Fair → Strong → Very Strong
- Progress bar color: Red → Orange → Yellow → Green
- Requirements listed below with live checkmarks

### Workflow
```
Fill form → Submit →
  Backend creates user (role: patient, status: pending) →
  Navigate to /verify-otp with phone/email in state
```

---

## Screen A3 — Verify OTP

**URL:** `/verify-otp`  
**Access:** Public (post-registration or post-login if MFA enabled)  
**Purpose:** OTP verification for account activation or 2FA

### Layout
```
┌────────────────────────────────────────────────────────────┐
│                [←]  Verify Account                         │
│                                                            │
│        ┌────────────────────────────────────────┐         │
│        │                  ✉️                     │         │
│        │    Enter Verification Code              │         │
│        │                                         │         │
│        │  We sent a 6-digit code to              │         │
│        │  +91 98765 43210                        │         │
│        │  [Change →]                             │         │
│        │                                         │         │
│        │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐│         │
│        │   │   │ │   │ │   │ │   │ │   │ │   ││         │
│        │   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘│         │
│        │                                         │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  │    Verify & Continue →            │  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │  Didn't receive code?                   │         │
│        │  [Resend OTP] · Expires in 04:30        │         │
│        └────────────────────────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Components
- Mail/SMS icon
- Masked phone/email display
- 6 individual OTP input boxes (large, centered, monospace font)
- Countdown timer (MM:SS format)
- Resend button (disabled until countdown reaches 0)
- Verify button

### States
| State | Visual |
|---|---|
| Empty | Light gray border boxes |
| Filled | Solid border, dark text |
| Error | Red border + shake animation + "Invalid code" |
| Expired | Yellow banner "Code expired - Resend?" |
| Success | Green checkmark + redirect |

### Interactions
- Auto-focus first box on mount
- Auto-advance to next box on digit entry
- Backspace returns focus to previous box
- Paste full 6-digit code auto-fills all boxes
- Auto-submit when 6th digit entered

---

## Screen A4 — Forgot Password

**URL:** `/forgot-password`  
**Access:** Public  
**Purpose:** Initiate password reset via email

### Layout
```
┌────────────────────────────────────────────────────────────┐
│                [←]  Forgot Password                        │
│                                                            │
│        ┌────────────────────────────────────────┐         │
│        │              🔑                         │         │
│        │       Reset Your Password               │         │
│        │                                         │         │
│        │  Enter your email and we'll send a      │         │
│        │  password reset link to your inbox.     │         │
│        │                                         │         │
│        │  Email Address                          │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  │ you@email.com                     │  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │  ┌──────────────────────────────────┐  │         │
│        │  │    Send Reset Link →              │  │         │
│        │  └──────────────────────────────────┘  │         │
│        │                                         │         │
│        │           [← Back to Login]             │         │
│        └────────────────────────────────────────┘         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### States
- **Success:** Green banner "Reset link sent! Check your inbox."
- **Not Found:** Inline error "No account found with this email"
- **Loading:** Button disabled + spinner

---

## Screen A5 — Reset Password

**URL:** `/reset-password?token=...`  
**Access:** Public (requires valid token in URL)  
**Purpose:** Set new password after clicking email link

### Layout
```
        ┌────────────────────────────────────────┐
        │              🔒                         │
        │       Create New Password               │
        │                                         │
        │  New Password               [👁]        │
        │  ┌──────────────────────────────────┐  │
        │  └──────────────────────────────────┘  │
        │                                         │
        │  Confirm New Password       [👁]        │
        │  ┌──────────────────────────────────┐  │
        │  └──────────────────────────────────┘  │
        │                                         │
        │  Password Strength ████████████  Strong │
        │  ✓ 8+  ✓ Uppercase  ✓ Number           │
        │                                         │
        │  ┌──────────────────────────────────┐  │
        │  │    Reset Password →               │  │
        │  └──────────────────────────────────┘  │
        └────────────────────────────────────────┘
```

---

---

# SECTION 2 — PATIENT SCREENS

---

## Screen P1 — Patient Dashboard

**URL:** `/patient`  
**Layout:** Top navbar + full page content  
**Purpose:** Central hub — queue status, upcoming appointments, quick actions

### Layout
```
┌──────────────────────────────────────────────────────────────────────┐
│ [Logo] MediQueue  Dashboard·Appts·Queue·Vault·Consent·Rx   [🔔] [👤] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Good morning, Rajesh! 👋                                            │
│  Here's your health summary for today.                               │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  🎫  YOUR ACTIVE QUEUE TOKEN                                     ││
│  │                                                                  ││
│  │         TOKEN  A - 4 2                                           ││
│  │                                                                  ││
│  │  Queue Position: 5th  ·  Est. Wait: 15 mins  ·  Status: Waiting ││
│  │  Dr. Amit Sharma  ·  Cardiology  ·  Today 2:00 PM               ││
│  │                                                                  ││
│  │            [View Live Queue →]                                   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────┐ ┌──────────────────┐ ┌─────────────────┐      │
│  │  📅              │ │  📁               │ │  ⏱              │      │
│  │  Book            │ │  Health Records   │ │  Join Queue     │      │
│  │  Appointment     │ │                   │ │                 │      │
│  └─────────────────┘ └──────────────────┘ └─────────────────┘      │
│                                                                      │
│  Upcoming Appointments                              [View All →]     │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  📅 Jan 25 · 2:30 PM  │  Dr. Patel — General Checkup            ││
│  │  Token: B-15           │  Location: Room 204                     ││
│  │  [View Details]   [Cancel Appointment]                          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  Recent Activity                                   [View All →]     │
│  ──────────────────────────────────────────────────────────────     │
│  •  Dr. Sharma accessed your ECG report — 2 hours ago               │
│  •  Prescription issued by Dr. Sharma — Yesterday                   │
│  •  Lab results uploaded — Jan 15                                    │
│                                                                      │
│  Quick Stats                                                         │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │
│  │ 12            │ │ 8             │ │ 3             │             │
│  │ Total Visits  │ │ Records       │ │ Active Shared │             │
│  └───────────────┘ └───────────────┘ └───────────────┘             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Empty States
- **No active token:** Indigo banner — "You are not in any queue. [Join Queue →]"
- **No appointments:** Gray card — "No upcoming appointments. [Book Now →]"
- **No activity:** Muted text — "No recent activity yet."

### Status Badge Colors
| Status | Color | Label |
|---|---|---|
| waiting | Amber | ⏳ Waiting |
| called | Green pulse | 🔔 Called! |
| in-progress | Blue | 🔵 In Progress |
| completed | Gray | ✓ Completed |
| cancelled | Red | ✗ Cancelled |

---

## Screen P2 — Join Queue

**URL:** `/patient/queue/join`  
**Purpose:** Select doctor/department and get a queue token

### Layout
```
┌──────────────────────────────────────────────────────────┐
│  [←]  Join Queue                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Select a Department                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │  🫀          │ │  🦴          │ │  🧠          │       │
│  │  Cardiology │ │ Orthopedics │ │  Neurology  │       │
│  │  4 doctors  │ │  3 doctors  │ │  2 doctors  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                          │
│  Available Doctors in Cardiology          [← Change]    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  👨‍⚕️  Dr. Amit Sharma  ·  Cardiology              │   │
│  │  Currently seeing patient 5 · 12 in queue        │   │
│  │  Est. wait for you:  ~18 minutes                 │   │
│  │  Queue Status: [🟢  Active]                      │   │
│  │                     [Join This Queue →]          │   │
│  ├──────────────────────────────────────────────────┤   │
│  │  👩‍⚕️  Dr. Priya Patel  ·  Cardiology               │   │
│  │  Currently seeing patient 2 · 5 in queue         │   │
│  │  Est. wait for you:  ~8 minutes                  │   │
│  │  Queue Status: [🟢  Active]                      │   │
│  │                     [Join This Queue →]          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Confirmation Modal (on Join)
```
┌─────────────────────────────────────┐
│  Confirm Queue Entry                │
│                                     │
│  Dr. Amit Sharma — Cardiology       │
│  Est. Wait Time: ~18 minutes        │
│  Your Position: #13                 │
│                                     │
│  [Cancel]    [Confirm & Join →]     │
└─────────────────────────────────────┘
```

### Workflow
```
Select Department → View Available Doctors →
Click "Join Queue" → Confirm Modal →
Backend assigns token → Navigate to /patient/queue
(WebSocket notifies doctor of new patient)
```

---

## Screen P3 — Live Queue Tracking

**URL:** `/patient/queue`  
**Purpose:** Real-time queue position, WebSocket live updates  
**Real-time:** Auto-updates every 30s + WebSocket push

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  [←]  Live Queue Tracking             🔄 Live · Updated 2s  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🎫  Your Token                                       │  │
│  │                                                       │  │
│  │            A  -  4  2                                 │  │
│  │                                                       │  │
│  │  Position in Queue:       5                           │  │
│  │  Estimated Wait Time:     ~15 minutes                 │  │
│  │  Status:             🟡  Waiting                      │  │
│  │  Doctor:             Dr. Amit Sharma                  │  │
│  │  Department:         Cardiology                       │  │
│  │  Appointment Time:   2:00 PM Today                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  Queue Progress                                              │
│  ──────────────────────────────────────────────────────      │
│  🟢  Token A-38  ·  In Progress with Doctor                  │
│  ──────────────────────────────────────────────────────      │
│  🟡  Token A-39  ·  Next in Line                             │
│  ──────────────────────────────────────────────────────      │
│  🟡  Token A-40  ·  Waiting                                  │
│  ──────────────────────────────────────────────────────      │
│  🟡  Token A-41  ·  Waiting                                  │
│  ──────────────────────────────────────────────────────      │
│  ►   Token A-42  ·  YOU ARE HERE · Waiting                   │
│  ──────────────────────────────────────────────────────      │
│  ⚪  Token A-43  ·  Waiting                                  │
│                                                              │
│              [Cancel Appointment]                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Called State (Full-screen overlay)
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                       🔔                                     │
│                                                              │
│              YOU'VE BEEN CALLED!                             │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Token: A-42                                          │  │
│  │  Dr. Amit Sharma is ready to see you now              │  │
│  │  Please proceed to: Room 305, 3rd Floor               │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  [I'm On My Way ✓]         [View Directions →]              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
- Full-screen green/indigo overlay
- Plays notification sound
- Vibrates on mobile
- Sends push notification if app is in background

---

## Screen P4 — Book Appointment (Multi-Step)

**URL:** `/patient/appointments/book`  
**Purpose:** 5-step wizard to book a doctor appointment

### Step 1 — Select Department
```
┌──────────────────────────────────────────────────────────────┐
│  [←]  Book Appointment                                       │
│  Step 1 of 5  ●───○───○───○───○                              │
├──────────────────────────────────────────────────────────────┤
│  Select a Department                                         │
│                                                              │
│  [🔍 Search departments...]                                  │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  🫀           │ │  🦴           │ │  👁           │        │
│  │  Cardiology  │ │ Orthopedics  │ │ Ophthalmology│        │
│  │  8 Doctors   │ │  5 Doctors   │ │  6 Doctors   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  🧠           │ │  🦷           │ │  👂           │        │
│  │  Neurology   │ │  Dentistry   │ │    ENT       │        │
│  │  4 Doctors   │ │  7 Doctors   │ │  3 Doctors   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

### Step 2 — Select Doctor
```
│  Step 2 of 5  ●───●───○───○───○     [← Cardiology]          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [👨‍⚕️]  Dr. Amit Sharma                               │   │
│  │         Cardiologist · MBBS MD · 15 years exp.       │   │
│  │         ⭐ 4.8   (234 reviews)                        │   │
│  │         🕒 Next available: Today 2:00 PM              │   │
│  │                        [View Profile]  [Select →]   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  [👩‍⚕️]  Dr. Priya Patel                               │   │
│  │         Cardiologist · MBBS MD · 10 years exp.       │   │
│  │         ⭐ 4.6   (187 reviews)                        │   │
│  │         🕒 Next available: Tomorrow 10:00 AM          │   │
│  │                        [View Profile]  [Select →]   │   │
│  └──────────────────────────────────────────────────────┘   │
```

### Step 3 — Select Date
```
│  Step 3 of 5  ●───●───●───○───○                              │
│                                                              │
│       January 2026              [◀]  [▶]                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Mo   Tu   We   Th   Fr   Sa   Su                    │   │
│  │             1    2    3    4    5                     │   │
│  │             ❌   ✅   ✅   ❌   ❌                     │   │
│  │   6    7    8    9   10   11   12                     │   │
│  │  ✅   ✅   ✅   ❌   ✅   ❌   ❌                     │   │
│  │  ...                                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  Legend:  ✅ Available   ❌ Unavailable   🔵 Selected        │
```

### Step 4 — Select Time
```
│  Step 4 of 5  ●───●───●───●───○    Tuesday, Jan 21          │
│                                                              │
│  Morning Slots                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ 9:00 AM │ │ 9:30 AM │ │10:00 AM │ │10:30 AM │          │
│  │Available│ │  Booked │ │Available│ │Available│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│  Afternoon Slots                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │ 2:00 PM │ │ 2:30 PM │ │ 3:00 PM │                       │
│  │Available│ │Available│ │  Booked │                       │
│  └─────────┘ └─────────┘ └─────────┘                       │
```

### Step 5 — Review & Confirm
```
│  Step 5 of 5  ●───●───●───●───●                              │
│                                                              │
│  Appointment Summary                              [Edit]     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Department:  Cardiology                             │   │
│  │  Doctor:      Dr. Amit Sharma                        │   │
│  │  Date:        Tuesday, January 21, 2026              │   │
│  │  Time:        2:00 PM – 2:30 PM                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Reason for Visit (Optional)                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Describe your symptoms or reason for visit...        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [Back]                [Confirm Booking →]                   │
```

### Step 6 — Success Screen (post-booking)
```
│              ✅                                               │
│    Appointment Booked Successfully!                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               Your Token Number                      │   │
│  │                                                      │   │
│  │                  A  -  4  2                          │   │
│  │  ──────────────────────────────────────────────────  │   │
│  │  Dr. Amit Sharma  ·  Cardiology                      │   │
│  │  Tuesday, January 21, 2026  at  2:00 PM             │   │
│  │  Queue Position: 5th  ·  Est. Wait: 15 mins         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  📧 Confirmation sent to rajesh@email.com                    │
│  📱 SMS sent to +91 98765 43210                              │
│                                                              │
│  [View Live Queue]   [Add to Calendar]   [Dashboard]         │
```

---

## Screen P5 — Appointments List

**URL:** `/patient/appointments`  
**Purpose:** View all past and upcoming appointments

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  My Appointments               [📅 Book New Appointment +]   │
├──────────────────────────────────────────────────────────────┤
│  [Upcoming ▾]   [All▾]   [Filter by Date▾]   [Search🔍]     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  January 21, 2026                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🟢 Confirmed                                         │   │
│  │  Dr. Amit Sharma — Cardiology                        │   │
│  │  2:00 PM  ·  Token: A-42  ·  Room 305               │   │
│  │  [View Details]  [Join Queue]  [Cancel]              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  January 15, 2026 (Past)                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✓ Completed                                          │   │
│  │  Dr. Priya Patel — General Medicine                  │   │
│  │  10:30 AM  ·  Token: B-15                            │   │
│  │  [View Summary]  [Download Prescription]  [Rebook]  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen P6 — Health Vault

**URL:** `/patient/records`  
**Purpose:** View, upload, and manage encrypted medical records

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🏦 Health Vault              [🔍 Search]  [+ Upload Record] │
├──────────────────────────────────────────────────────────────┤
│  [All Types ▾]  [Filter by Date ▾]  [Sort: Newest ▾]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Storage Used: ████████░░░░  127 MB / 500 MB                │
│                                                              │
│  January 18, 2026                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄  ECG Report                      🔒 Encrypted    │   │
│  │  Uploaded by: Dr. Amit Sharma · Cardiology           │   │
│  │  ecg_report_jan18.pdf · 2.3 MB                       │   │
│  │  [👁 View]  [⬇ Download]  [🔗 Share]  [🗑 Delete]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  💊  Prescription                    🔒 Encrypted    │   │
│  │  Dr. Amit Sharma · Cardiology                        │   │
│  │  Medications: Aspirin 75mg, Metoprolol 50mg          │   │
│  │  [👁 View]  [⬇ Download as PDF]                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  January 10, 2026                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🩸  Blood Test Report               🔒 Encrypted    │   │
│  │  Dr. Raj Verma · Pathology Lab                       │   │
│  │  blood_panel_jan10.pdf · 1.1 MB                      │   │
│  │  [👁 View]  [⬇ Download]  [🔗 Share]                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Record Type Icons
| Type | Icon | Color |
|---|---|---|
| Lab Report | 🧪 | Blue |
| Prescription | 💊 | Green |
| Blood Test | 🩸 | Red |
| X-Ray / Imaging | 🔬 | Purple |
| Doctor Notes | 📋 | Amber |
| Vaccination | 💉 | Teal |
| ECG / Cardiac | 📄 | Indigo |

### Upload Record Modal
```
┌──────────────────────────────────────────┐
│  Upload Medical Record             [×]   │
│                                          │
│  Record Type *                           │
│  [Dropdown: Lab Report / Prescription /] │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │   📁  Drop files here or Browse  │   │
│  │   PDF, JPG, PNG · Max 10MB each  │   │
│  │   Up to 5 files at once          │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Description (Optional)                  │
│  ┌──────────────────────────────────┐   │
│  └──────────────────────────────────┘   │
│                                          │
│  [Cancel]        [Upload & Encrypt →]   │
└──────────────────────────────────────────┘
```

---

## Screen P7 — Consent Management

**URL:** `/patient/consent`  
**Purpose:** Control which doctors can access which medical records

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🛡 Consent Management                  [+ Grant New Access] │
├──────────────────────────────────────────────────────────────┤
│  [Active ▾]   [All Doctors ▾]   [All Record Types ▾]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Active Consents                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  👨‍⚕️  Dr. Amit Sharma · Cardiology                    │   │
│  │  Access: All Cardiac Records · Lab Reports           │   │
│  │  Granted: Jan 15, 2026  ·  Expires: Mar 15, 2026     │   │
│  │  [🔄 Extend]  [✏ Edit Access]  [🚫 Revoke]          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  👩‍⚕️  Dr. Priya Patel · General Medicine              │   │
│  │  Access: General Records Only                        │   │
│  │  Granted: Jan 10, 2026  ·  Expires: Feb 10, 2026    │   │
│  │  [🔄 Extend]  [✏ Edit Access]  [🚫 Revoke]          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Pending Access Requests  (2)                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  👨‍⚕️  Dr. Rajan Verma · Neurology                    │   │
│  │  Requesting: MRI Reports, Brain Scans               │   │
│  │  Reason: Post-surgery follow-up                     │   │
│  │  [✅ Grant Access]    [❌ Deny]                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Consent History              [View Full History →]          │
│  •  Revoked Dr. Mehta access — Jan 12, 2026                 │
│  •  Granted Dr. Sharma access — Jan 10, 2026                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Grant Consent Modal
```
┌───────────────────────────────────────────────┐
│  Grant Medical Record Access            [×]   │
│                                               │
│  Doctor                                       │
│  [Search doctor by name or ID...]            │
│                                               │
│  Records to Share                             │
│  ☑ All Records (Full Access)                 │
│  ○ Specific Records Only                     │
│    ☑ Lab Reports  ☑ Prescriptions            │
│    ☐ Imaging  ☐ Doctor Notes                 │
│                                               │
│  Access Duration                              │
│  ○ 1 Week  ● 1 Month  ○ 3 Months  ○ Custom  │
│  Expires: March 15, 2026                      │
│                                               │
│  [Cancel]          [Grant Access →]           │
└───────────────────────────────────────────────┘
```

---

## Screen P8 — Prescriptions (Patient View)

**URL:** `/patient/prescriptions`  
**Purpose:** View all prescriptions issued by doctors

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  💊 My Prescriptions                                         │
├──────────────────────────────────────────────────────────────┤
│  [All ▾]  [Active ▾]  [Search by medication...]             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  💊  Prescription #RX-2026-001          🟢 Active    │   │
│  │  Dr. Amit Sharma · Cardiology                        │   │
│  │  Issued: January 18, 2026                            │   │
│  │                                                      │   │
│  │  Medications:                                        │   │
│  │  • Aspirin 75mg — Once daily after breakfast         │   │
│  │  • Metoprolol 50mg — Twice daily                     │   │
│  │                                                      │   │
│  │  Diagnosis: Hypertension management                  │   │
│  │  Duration: 30 days  ·  Follow-up: Feb 18, 2026       │   │
│  │                                                      │   │
│  │  [View Full Prescription]  [⬇ Download PDF]          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

---

# SECTION 3 — DOCTOR SCREENS

---

## Screen D1 — Doctor Dashboard

**URL:** `/doctor`  
**Layout:** Left sidebar + main content  
**Purpose:** Daily overview — queue stats, current patient, today's appointments

### Layout
```
┌──────────────────┬──────────────────────────────────────────────────┐
│  [Logo]          │  Good morning, Dr. Sharma!           [🔔]  [👤]  │
│  MediQueue       │  Thursday, January 21, 2026                      │
│  Doctor Portal   ├──────────────────────────────────────────────────┤
│ ──────────────── │                                                   │
│  🏠 Dashboard ◄  │  Queue Overview                                   │
│  ⏱  Queue        │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  📅 Appointments │  │  14      │ │  2       │ │  8       │        │
│  📁 Shared Rec.  │  │ Waiting  │ │In Progress│ │ Completed│        │
│  💊 Prescriptions│  └──────────┘ └──────────┘ └──────────┘        │
│  🚨 Emergency    │                                                   │
│ ──────────────── │  Queue Status:  [🟢 Active]  [⏸ Pause Queue]    │
│  👤 Profile      │                                                   │
│  ❓ Help          │  Current Patient                                  │
│  🚪 Logout       │  ┌──────────────────────────────────────────┐   │
│                  │  │  Token A-38  ·  In Progress  ·  12 mins   │   │
│                  │  │  Rajesh Kumar  ·  M, 45                   │   │
│                  │  │  Reason: Chest pain, follow-up            │   │
│                  │  │  [View Records]  [Write Prescription]     │   │
│                  │  │  [Complete Consultation →]                │   │
│                  │  └──────────────────────────────────────────┘   │
│                  │                                                   │
│                  │  Next in Queue                                    │
│                  │  ┌──────────────────────────────────────────┐   │
│                  │  │  Token A-39  ·  Priya Singh  ·  F, 32    │   │
│                  │  │  Arriving from: Waiting Room 2            │   │
│                  │  │  [Call Patient →]    [Skip]              │   │
│                  │  └──────────────────────────────────────────┘   │
│                  │                                                   │
│                  │  Today's Appointments (6)          [View All]    │
│                  │  ┌──────────────────────────────────────────┐   │
│                  │  │  2:00 PM  ·  Ankit Mehta  ·  Consultation│   │
│                  │  │  2:30 PM  ·  Sunita Raj  ·  Follow-up    │   │
│                  │  └──────────────────────────────────────────┘   │
│                  │                                                   │
└──────────────────┴──────────────────────────────────────────────────┘
```

---

## Screen D2 — Queue Management

**URL:** `/doctor/queue`  
**Purpose:** Full queue view with all actions — call, skip, complete, pause

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  ⏱ Queue Management                                          │
│  Status: 🟢 Active  ·  14 Waiting  ·  Avg wait: 18 min      │
│                        [⏸ Pause Queue]  [🔄 Refresh]        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔵 IN PROGRESS                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Token: A-38  ·  Rajesh Kumar  (M, 45)               │   │
│  │  Joined: 10:45 AM  ·  Called: 11:02 AM  ·  Elapsed: 12min│
│  │  Reason: Chest pain, follow-up                       │   │
│  │  [👁 View Records]  [💊 Write Prescription]           │   │
│  │  [✅ Complete Consultation]                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  🟡 NEXT IN LINE                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Token: A-39  ·  Priya Singh  (F, 32)                │   │
│  │  Wait time: 25 mins                                  │   │
│  │  [📣 Call Next Patient →]    [⏭ Skip]               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  🟡 WAITING (12)                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  A-40  ·  Ankit Mehta     ·  Wait: 30 min           │   │
│  │  A-41  ·  Sunita Raj      ·  Wait: 35 min           │   │
│  │  A-42  ·  Kiran Shah      ·  Wait: 40 min           │   │
│  │  [Load 9 more...]                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ✅ COMPLETED TODAY (8)                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  A-30  ·  Mohan Lal  ·  Completed at 09:15 AM       │   │
│  │  [View Notes]  [View Prescription]                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Complete Consultation Modal
```
┌───────────────────────────────────────────────────┐
│  Complete Consultation                      [×]   │
│  Patient: Rajesh Kumar · Token A-38               │
│                                                   │
│  Diagnosis / Consultation Notes *                 │
│  ┌───────────────────────────────────────────┐   │
│  │ Hypertension follow-up. BP 140/90. Meds   │   │
│  │ adjusted. Advised dietary changes.        │   │
│  └───────────────────────────────────────────┘   │
│                                                   │
│  ☑ Prescription issued                            │
│  ☐ Lab tests ordered                              │
│  ☐ Referral issued                                │
│                                                   │
│  Follow-up Required?  ● Yes  ○ No                 │
│  Follow-up Date: [Date Picker]                    │
│                                                   │
│  [Cancel]       [Complete & Call Next →]          │
└───────────────────────────────────────────────────┘
```

### Pause Queue Modal
```
┌───────────────────────────────────────────────────┐
│  Pause Queue                                      │
│  Reason *                                         │
│  ● Short break (5-10 min)                         │
│  ○ Lunch break (30 min)                           │
│  ○ Emergency procedure                            │
│  ○ Technical issue                                │
│                                                   │
│  Duration: [__] minutes                           │
│  [Cancel]     [Pause Queue]                       │
└───────────────────────────────────────────────────┘
```

---

## Screen D3 — Patient Records (Doctor View)

**URL:** `/doctor/patients/:patientId/records`  
**Purpose:** View patient medical records (consent-gated)  
**Two states:** No Access · Access Granted

### State A — No Consent
```
┌──────────────────────────────────────────────────────────────┐
│  [←]  Patient Records — Rajesh Kumar                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  👤  Rajesh Kumar · Male · 45 years                          │
│  Patient ID: P-5678  ·  Blood Group: B+                     │
│  Allergies: Penicillin                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🔒  Medical Records — Access Restricted             │   │
│  │                                                      │   │
│  │  You do not have consent to view this patient's      │   │
│  │  medical records.                                    │   │
│  │                                                      │   │
│  │  Diagnosis/Notes:   ████████████ (hidden)            │   │
│  │  Lab Reports:       ████████████ (hidden)            │   │
│  │  Prescriptions:     ████████████ (hidden)            │   │
│  │                                                      │   │
│  │  [📋 Request Access]                                 │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ───────────────────────────────────────────────────────    │
│  🚨 Life-threatening emergency?                              │
│  [⚠ Request Emergency Override Access]                      │
│  This action will be permanently logged and reviewed.       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### State B — Full Access (Consent Granted)
```
┌──────────────────────────────────────────────────────────────┐
│  [←]  Patient Records — Rajesh Kumar                         │
│  🔓 Access granted by patient · Valid until March 15, 2026  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TABS: [Overview] [Records] [Prescriptions] [Visit History] │
│                                                              │
│  Medical History                                             │
│  Conditions: Hypertension (2021), Hyperlipidemia (2022)     │
│  Allergies: Penicillin                                       │
│  Surgeries: Appendectomy (2019)                             │
│                                                              │
│  Recent Records                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄  ECG Report  ·  Jan 18, 2026  ·  2.3 MB          │   │
│  │  [View]  [Download]                                  │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🩸  Lipid Profile  ·  Jan 10, 2026  ·  0.8 MB       │   │
│  │  [View]  [Download]                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Emergency Override Flow (3-step)

**Step 1 — Warning**
```
┌──────────────────────────────────────────────────────────────┐
│                  ⚠️  EMERGENCY OVERRIDE                       │
│                                                              │
│  You are about to access RESTRICTED patient records          │
│  WITHOUT patient consent.                                    │
│                                                              │
│  THIS ACTION WILL:                                           │
│  ⚠  Be PERMANENTLY logged with timestamp & IP               │
│  ⚠  Trigger IMMEDIATE notification to the patient           │
│  ⚠  Require WRITTEN JUSTIFICATION                           │
│  ⚠  Be REVIEWED by admin within 24 hours                    │
│  ⚠  May be subject to compliance investigation              │
│                                                              │
│  ☐ I confirm this is a genuine life-threatening emergency    │
│                                                              │
│  [Cancel — Return to Records]    [⚠ Continue →]             │
└──────────────────────────────────────────────────────────────┘
```

**Step 2 — Justification Form**
```
┌──────────────────────────────────────────────────────────────┐
│  🚨  EMERGENCY ACCESS JUSTIFICATION                          │
│                                                              │
│  Patient: Rajesh Kumar · P-5678                              │
│  Doctor:  Dr. Amit Sharma · Cardiology                       │
│  Time:    2026-01-21  14:35:10                               │
│                                                              │
│  Emergency Type *                                            │
│  [ Cardiac Emergency ▾ ]                                     │
│                                                              │
│  Justification * (minimum 50 characters)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Patient presented with severe chest pain and         │   │
│  │ loss of consciousness. Suspected MI. Records         │   │
│  │ needed for allergy check before medication.          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Witness (Optional)                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [← Back]                [🚨 Grant Emergency Access]         │
└──────────────────────────────────────────────────────────────┘
```

**Step 3 — Active Emergency Session Banner**
```
┌──────────────────────────────────────────────────────┐
│  🚨 EMERGENCY ACCESS ACTIVE                          │
│  Accessed at 14:35 · Patient Notified · Admin: Pending│
│  Records visible for this session only.              │
└──────────────────────────────────────────────────────┘
```

---

## Screen D4 — Create Prescription

**URL:** `/doctor/prescriptions/create`  
**Purpose:** Issue a digitally-signed prescription to a patient

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  [←]  Create Prescription                                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Patient                                                     │
│  [Search patient by name or ID...]                           │
│  Selected: Rajesh Kumar · P-5678                             │
│                                                              │
│  Diagnosis *                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Medications                                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Medication 1                                        │   │
│  │  Name: [Search / type medication name...]            │   │
│  │  Dosage: [500mg ▾]  Frequency: [Twice daily ▾]      │   │
│  │  Duration: [7 days ▾]                                │   │
│  │  Instructions: ──────────────────────────────        │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  [+ Add Another Medication]                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Additional Notes                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Follow-up Date (Optional)                                   │
│  [Date Picker]                                               │
│                                                              │
│  [Preview Prescription]     [Issue Prescription →]           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Prescription Preview (Print-ready format)
```
┌──────────────────────────────────────────────────────────────┐
│              🏥  MediQueue Health Services                   │
│  ────────────────────────────────────────────────────────    │
│  Dr. Amit Sharma                     Date: Jan 21, 2026      │
│  Cardiologist · License: MH/MED/12345                        │
│  ────────────────────────────────────────────────────────    │
│  Patient: Rajesh Kumar  ·  Age: 45  ·  ID: P-5678           │
│  ────────────────────────────────────────────────────────    │
│  Diagnosis: Hypertension + Hyperlipidemia                    │
│                                                              │
│  Rx                                                          │
│  1. Aspirin 75mg                                             │
│     Once daily after breakfast · 30 days                    │
│                                                              │
│  2. Metoprolol 50mg                                          │
│     Twice daily (morning + evening) · 30 days               │
│                                                              │
│  Notes: Avoid salty foods. Regular BP monitoring.           │
│  Follow-up: February 18, 2026                               │
│  ────────────────────────────────────────────────────────    │
│  [Digital Signature: Dr. Amit Sharma]                        │
│  ────────────────────────────────────────────────────────    │
│  [Close Preview]         [⬇ Download PDF]   [Issue →]       │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen D5 — Emergency Requests

**URL:** `/doctor/emergency-requests`  
**Purpose:** View status of doctor's own emergency override requests

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🚨 My Emergency Access Requests                             │
├──────────────────────────────────────────────────────────────┤
│  [All ▾]  [Pending ▾]  [This Month ▾]                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🔴  PENDING REVIEW                                   │   │
│  │  Patient: Rajesh Kumar · P-5678                       │   │
│  │  Emergency Type: Cardiac Emergency                    │   │
│  │  Accessed: Jan 21, 2026 · 14:35                      │   │
│  │  Records Accessed: 8 files                            │   │
│  │  Admin Review: Awaiting                               │   │
│  │  [View Details]                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ✅  APPROVED                                          │   │
│  │  Patient: Sunita Rao · P-4321                         │   │
│  │  Emergency Type: Severe Trauma                        │   │
│  │  Accessed: Jan 15, 2026 · 09:22                      │   │
│  │  Reviewed by: Admin on Jan 15 · 11:00 AM             │   │
│  │  Decision: Legitimate emergency — Approved           │   │
│  │  [View Details]                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen D6 — Doctor Appointments

**URL:** `/doctor/appointments`  
**Purpose:** View and manage today's + upcoming scheduled appointments

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  📅 Appointments             [Today ▾]  [📅 Calendar View]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Thursday, January 21, 2026                                  │
│                                                              │
│  09:00 AM  ·  Mohan Lal  ·  General Checkup    ✓ Completed  │
│  09:30 AM  ·  Priya Mehta  ·  Follow-up        ✓ Completed  │
│  ──────────────────────────────────────────────────────      │
│  2:00 PM   ·  Ankit Kumar  ·  Consultation    ⏳ Waiting    │
│  2:30 PM   ·  Sunita Rao   ·  Follow-up       ⏳ Waiting    │
│  3:00 PM   ·  Ravi Shah    ·  New Patient     ⏳ Upcoming   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [📋 View Patient]  [✓ Mark Completed]  [Cancel]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

---

# SECTION 4 — ADMIN SCREENS

---

## Screen AD1 — Admin Dashboard

**URL:** `/admin`  
**Layout:** Left sidebar + content  
**Purpose:** System-wide overview — health, alerts, activity, stats

### Layout
```
┌──────────────────┬────────────────────────────────────────────────┐
│  [Logo]          │  Admin Dashboard                  [🔔(12)] [👤]│
│  MediQueue       ├────────────────────────────────────────────────┤
│  Admin Portal    │                                                 │
│ ──────────────── │  System Health                                  │
│  🏠 Dashboard ◄  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  📜 Audit Logs   │  │ 🟢 API   │ │ 🟢 DB    │ │ 🟢 Socket│      │
│  🚨 Emrg. Cases  │  │ Online   │ │Connected │ │ 145 conn │      │
│  🛡 Emrg. Access │  │ 99.8%    │ │ Healthy  │ │ Online   │      │
│  👥 Users        │  └──────────┘ └──────────┘ └──────────┘      │
│  📊 Analytics    │                                                 │
│ ──────────────── │  Platform Statistics                            │
│  👤 Profile      │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  ❓ Help          │  │  1,247   │ │   89     │ │  14      │      │
│  🚪 Logout       │  │  Users   │ │  Doctors │ │ In Queue │      │
│                  │  └──────────┘ └──────────┘ └──────────┘      │
│                  │                                                 │
│                  │  🚨 Pending Emergency Access Reviews  (3)      │
│                  │  ┌────────────────────────────────────────┐   │
│                  │  │ 🔴 HIGH · Dr. Sharma · Rajesh Kumar    │   │
│                  │  │ Cardiac Emergency · 10:45 AM           │   │
│                  │  │ Status: Pending · 2 hours ago          │   │
│                  │  │                         [Review Now →] │   │
│                  │  ├────────────────────────────────────────┤   │
│                  │  │ 🟡 MED · Dr. Patel · Priya Singh       │   │
│                  │  │ Severe Trauma · 09:30 AM               │   │
│                  │  │                         [Review Now →] │   │
│                  │  └────────────────────────────────────────┘   │
│                  │                                                 │
│                  │  Live Activity Feed                             │
│                  │  ──────────────────────────────────────        │
│                  │  •  Dr. Sharma called patient A-40 — 2m ago    │
│                  │  •  New user registered — 5m ago               │
│                  │  •  Dr. Patel paused queue — 8m ago            │
│                  │                                                 │
│                  │  [View All Audit Logs →]                       │
└──────────────────┴────────────────────────────────────────────────┘
```

---

## Screen AD2 — User Management

**URL:** `/admin/users`  
**Purpose:** Create, view, edit, deactivate all users (patients, doctors, admins)

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  👥 User Management                         [+ Add User]     │
├──────────────────────────────────────────────────────────────┤
│  [🔍 Search by name/email/ID]  [Role ▾]  [Status ▾]  [Dept ▾]│
├──────────────────────────────────────────────────────────────┤
│                          Total: 1,247 users                  │
│                                                              │
│  Name                │ Role    │ Status   │ Dept      │  ⋮  │
│  ─────────────────────────────────────────────────────────  │
│  Dr. Amit Sharma     │ Doctor  │ 🟢 Active│ Cardiology│  ⋮  │
│  ID: D-1234                                                  │
│  ─────────────────────────────────────────────────────────  │
│  Rajesh Kumar        │ Patient │ 🟢 Active│  —        │  ⋮  │
│  ID: P-5678                                                  │
│  ─────────────────────────────────────────────────────────  │
│  Priya Singh         │ Patient │ 🔴 Blocked│ —        │  ⋮  │
│  ID: P-9012                                                  │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Actions menu (⋮):  View Profile · Edit · Block · Delete    │
│                                                              │
│  Showing 1–50 of 1,247      [◀ Prev]  Page 1/25  [Next ▶]  │
└──────────────────────────────────────────────────────────────┘
```

### Add User Modal
```
┌──────────────────────────────────────────────────┐
│  Add New User                              [×]   │
│                                                  │
│  Role *  ● Patient  ○ Doctor  ○ Admin           │
│                                                  │
│  First Name           Last Name                  │
│  ┌──────────────┐  ┌───────────────┐            │
│  └──────────────┘  └───────────────┘            │
│                                                  │
│  Email  ──────────────────────────────────────  │
│  Phone  ──────────────────────────────────────  │
│                                                  │
│  [IF DOCTOR] Specialization / License / Dept    │
│                                                  │
│  ☑ Send welcome email with credentials          │
│                                                  │
│  [Cancel]         [Create User →]               │
└──────────────────────────────────────────────────┘
```

---

## Screen AD3 — Audit Logs

**URL:** `/admin/audit`  
**Purpose:** Full system activity log — search, filter, export, investigate

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  📜 Audit Logs                               [⬇ Export CSV] │
├──────────────────────────────────────────────────────────────┤
│  [🔍 Search user/action/patient]                             │
│  [Date Range ▾]  [Action Type ▾]  [Role ▾]  [Severity ▾]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Date/Time          │ User           │ Action      │Severity│
│  ──────────────────────────────────────────────────────────  │
│  Jan 21 · 14:35:10  │ Dr. Sharma     │ 🚨 Emergency│  HIGH  │
│                     │ (Doctor)       │ Override    │        │
│                     │ Patient: Rajesh Kumar       │  [↗]   │
│  ──────────────────────────────────────────────────────────  │
│  Jan 21 · 14:10:05  │ Rajesh Kumar   │ ✅ Login    │  LOW   │
│                     │ (Patient)      │             │  [↗]   │
│  ──────────────────────────────────────────────────────────  │
│  Jan 21 · 13:45:22  │ Admin User     │ 🔧 User     │  MED   │
│                     │ (Admin)        │ Created     │  [↗]   │
│  ──────────────────────────────────────────────────────────  │
│                                                              │
│  Showing 1–50 of 3,421      [◀]  1  2  3  ...  69  [▶]    │
└──────────────────────────────────────────────────────────────┘
```

### Log Detail Drawer (slides in from right)
```
┌─────────────────────────────────────────┐
│  Audit Record Detail              [×]   │
│                                         │
│  Event: Emergency Access Override       │
│  Severity: 🔴 HIGH                      │
│                                         │
│  Timestamp: Jan 21, 2026 · 14:35:10     │
│  Actor: Dr. Amit Sharma (D-1234)        │
│  Patient: Rajesh Kumar (P-5678)         │
│  IP Address: 192.168.1.45               │
│  Device: Chrome 121 · Windows           │
│  Location: Hospital Network             │
│                                         │
│  Action Details                         │
│  Type: EMERGENCY_OVERRIDE_ACCESS        │
│  Records Accessed: 8 files              │
│  Duration: 15 minutes                   │
│  Justification: [View full text →]      │
│                                         │
│  Timeline                               │
│  14:35:00  Override initiated           │
│  14:35:10  Access granted               │
│  14:50:00  Session ended                │
│  14:51:00  Patient notified             │
│                                         │
│  [Flag for Investigation]               │
└─────────────────────────────────────────┘
```

---

## Screen AD4 — Emergency Access Review

**URL:** `/admin/emergency-access`  
**Purpose:** Review, approve, or flag doctor emergency override requests

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🛡 Emergency Access Reviews                                  │
│  3 Pending  ·  All must be reviewed within 24h              │
├──────────────────────────────────────────────────────────────┤
│  [Status ▾]  [Priority ▾]  [Date ▾]                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔴 HIGH PRIORITY — Immediate review required                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Doctor: Dr. Amit Sharma · D-1234 · Cardiology       │   │
│  │  Patient: Rajesh Kumar · P-5678                       │   │
│  │  Time: Jan 21, 2026 · 14:35                          │   │
│  │  Type: Cardiac Emergency                              │   │
│  │  Records Accessed: 8 files                            │   │
│  │  Status: 🔴 Pending (2 hours ago)                    │   │
│  │                              [Review Now →]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  🟡 MEDIUM PRIORITY                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Doctor: Dr. Priya Patel · Orthopaedic Surgery       │   │
│  │  Patient: Sunita Rao · Severe Trauma                  │   │
│  │  Status: 🟡 Pending (4 hours ago)                    │   │
│  │                              [Review Now →]           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Review Detail Screen
```
┌──────────────────────────────────────────────────────────────┐
│  🛡 Review Emergency Access                                   │
│  Status: 🔴 PENDING · Priority: HIGH                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Doctor Info                     Patient Info               │
│  Dr. Amit Sharma                 Rajesh Kumar               │
│  Cardiology · D-1234             P-5678 · M · 45            │
│  License: MH/MED/12345           +91 98765 43210            │
│                                                              │
│  Emergency Details                                           │
│  Type: Cardiac Emergency                                     │
│  Time: Jan 21, 2026 · 14:35:10                              │
│  Duration: 15 minutes                                        │
│  Records Accessed: 8 files (view list →)                    │
│  Witness: Nurse Pooja · N-789                               │
│                                                              │
│  Doctor's Justification                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Patient presented with severe chest pain. Suspected  │   │
│  │ MI. Required allergy info before emergency meds.     │   │
│  │ Patient unconscious, unable to provide consent.      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Access Timeline                                             │
│  14:35:00  Override initiated by Dr. Sharma                 │
│  14:35:10  Auto-approved, access granted                    │
│  14:50:00  Session ended                                     │
│  14:51:00  Patient auto-notified by system                  │
│                                                              │
│  Verification Checklist                                      │
│  ☑ Emergency confirmed by hospital records                  │
│  ☑ Doctor credentials verified                              │
│  ☐ Records accessed match emergency type                    │
│  ☐ No policy violations detected                            │
│                                                              │
│  Admin Decision *                                            │
│  ● ✅ Approve — Legitimate emergency                         │
│  ○ ❌ Reject — Insufficient justification                    │
│  ○ ⚠ Flag — Requires compliance investigation               │
│                                                              │
│  Admin Notes *                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  [← Back to List]            [Submit Review →]              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen AD5 — Analytics Dashboard

**URL:** `/admin/analytics`  
**Purpose:** Hospital-wide performance metrics and trends

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  📊 Analytics Dashboard        [Period: Today ▾]  [Export]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Summary Cards                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │   156      │ │  12.5 min  │ │  98.5%     │ │  45 min  │ │
│  │  Patients  │ │  Avg Wait  │ │ Completion │ │ Peak Wait│ │
│  │  Today     │ │  Time      │ │  Rate      │ │  Today   │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│                                                              │
│  Wait Time Trends — Last 7 Days                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Line Chart: avg wait time each day]                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Doctor Utilization                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Dr. Sharma    ████████████████████░░  85%             │   │
│  │  Dr. Patel     ███████████████░░░░░░  70%              │   │
│  │  Dr. Verma     ████████████████████░  80%              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Peak Hours Heatmap (by day + hour)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Heatmap grid: rows = days, cols = hours]           │   │
│  │  Darker = More patients                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Department Performance                                      │
│  Cardiology:    125 patients · 10 min avg · 99% completion  │
│  Orthopedics:    89 patients · 15 min avg · 97% completion  │
│  General:       156 patients ·  8 min avg · 100% completion │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen AD6 — Emergency Cases (Admin)

**URL:** `/admin/emergency-cases`  
**Purpose:** Review all flagged emergency medical cases in the system

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🚨 Emergency Cases                            [Create Case] │
├──────────────────────────────────────────────────────────────┤
│  [All ▾]  [Status ▾]  [Priority ▾]   [🔍 Search]            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🔴 CRITICAL                                          │   │
│  │  Case #EC-2026-001                                   │   │
│  │  Patient: Rajesh Kumar · Dept: Cardiology            │   │
│  │  Doctor: Dr. Amit Sharma                             │   │
│  │  Opened: Jan 21, 2026 · 14:35                        │   │
│  │  Status: Under Treatment                             │   │
│  │  [View Full Case]  [Update Status]  [Close Case]    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

---

# SECTION 5 — SHARED SCREENS

---

## Screen S1 — User Profile

**URL:** `/:role/profile`  
**Access:** All authenticated users  
**Purpose:** View and edit personal + professional information

### Layout (Patient / Doctor / Admin)
```
┌──────────────────────────────────────────────────────────────┐
│  👤 My Profile                            [✏ Edit Profile]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐  Dr. Amit Sharma                               │
│  │  [Photo]│  Cardiologist · MediQueue Hospital             │
│  │  +Upload│  Member since: January 2024                    │
│  └─────────┘  ID: D-1234                                    │
│                                                              │
│  TABS:  [Personal Info]  [Professional Info*]  [Security]   │
│         (* Doctors only)                                    │
│                                                              │
│  Personal Info Tab                                           │
│  ──────────────────────────────────────────────────         │
│  First Name: Amit          Last Name: Sharma                 │
│  Email: amit.sharma@hospital.com                             │
│  Phone: +91 98765 43210                                      │
│  Date of Birth: March 15, 1979                               │
│  Gender: Male                                                │
│  Address: 45, MG Road, Mumbai                                │
│                                                              │
│  Security Tab                                                │
│  ──────────────────────────────────────────────────         │
│  Password:  ●●●●●●●●    [Change Password]                   │
│  Two-Factor Auth:  🟢 Enabled  [Manage]                     │
│  Active Sessions:   2 devices  [View & Revoke]              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Screen S2 — Notification Center

**URL:** `/:role/notifications`  
**Access:** All authenticated users  
**Purpose:** Full notification history with actions

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🔔 Notifications              [Mark All Read]  [Clear All] │
├──────────────────────────────────────────────────────────────┤
│  [All ▾]  [Unread ▾]  [Type ▾]                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Today                                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  🔔  Your token A-42 has been called!                │   │
│  │  Dr. Sharma is ready · Please proceed to Room 305   │   │
│  │  2 mins ago                              [View →]   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  🔵  Access Request Received                          │   │
│  │  Dr. Rajan Verma requests access to your MRI scans  │   │
│  │  1 hour ago            [✅ Grant]  [❌ Deny]          │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  ✅  Appointment Confirmed                            │   │
│  │  Dr. Sharma · Jan 25 · 2:30 PM                      │   │
│  │  2 hours ago                             [View →]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Yesterday                                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ⚪  Prescription ready for download                  │   │
│  │  Jan 20 · 3:45 PM                       [View →]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Notification Bell Dropdown (global header)
```
┌─────────────────────────────────────────┐
│  Notifications (3 new)   [View All →]   │
├─────────────────────────────────────────┤
│  🔔 Token A-42 called! · 2m ago         │
│  🔵 Access request from Dr. Verma       │
│  ✅ Appointment confirmed · 2h ago      │
└─────────────────────────────────────────┘
```

---

## Screen S3 — Help & Support

**URL:** `/:role/help`  
**Access:** All authenticated users  
**Purpose:** FAQ, guides, contact support

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  ❓ Help & Support                                            │
├──────────────────────────────────────────────────────────────┤
│  [🔍 Search for help...]                                     │
│                                                              │
│  Quick Guides                                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  📅           │ │  ⏱           │ │  🏦           │        │
│  │  How to Book │ │  Using Queue │ │  Health Vault│        │
│  │  an Appt.    │ │  Tracking    │ │  Guide       │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                              │
│  Frequently Asked Questions                                  │
│  ──────────────────────────────────────────────────         │
│  ▸  How do I join a queue?                                  │
│  ▸  Can I cancel my appointment?                            │
│  ▸  How does consent for record access work?                │
│  ▸  What is an emergency override?                          │
│  ▸  How do I reset my password?                             │
│                                                              │
│  Contact Support                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📧 support@mediqueuehealth.com                       │   │
│  │  📞 1800-123-4567 (9 AM – 6 PM IST)                  │   │
│  │  💬 [Start Live Chat]                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

---

# SECTION 6 — MOBILE SCREENS

---

## Mobile Design Specs
- Breakpoints: Mobile < 640px · Tablet 640–1024px · Desktop > 1024px
- Minimum touch target: 44×44px
- Patient: Top navbar → hamburger on mobile
- Doctor/Admin: Sidebar → drawer on mobile (slide-in from left)
- Bottom action buttons: sticky, always visible
- Font size: minimum 16px for inputs (prevents iOS zoom)

## Mobile Patient Dashboard
```
┌─────────────────────────┐
│ ≡  MediQueue      🔔(3) │  ← Fixed top bar
├─────────────────────────┤
│ 👋 Hello, Rajesh        │
│                         │
│ ┌─────────────────────┐ │
│ │   🎫 Token A-42     │ │
│ │                     │ │
│ │   Position: 5th     │ │
│ │   Wait: ~15 mins    │ │
│ │   🟡 Waiting        │ │
│ │                     │ │
│ │ [Track Live Queue →]│ │
│ └─────────────────────┘ │
│                         │
│ Quick Actions           │
│ ┌────────┐ ┌────────┐  │
│ │ 📅 Book│ │🎫 Queue│  │
│ └────────┘ └────────┘  │
│ ┌────────┐ ┌────────┐  │
│ │📁Vault │ │🛡Consent│ │
│ └────────┘ └────────┘  │
│                         │
│ Upcoming                │
│ ┌─────────────────────┐ │
│ │ Dr. Sharma          │ │
│ │ Jan 25 · 2:30 PM    │ │
│ │         [Details →] │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 🏠   📅   🎫   📁   👤  │  ← Fixed bottom nav
└─────────────────────────┘
```

## Mobile Called State (Full-screen)
```
┌─────────────────────────┐
│                         │
│         🔔              │
│                         │
│   YOU'VE BEEN CALLED!   │
│                         │
│  Token: A-42            │
│  Dr. Sharma is ready    │
│  Go to Room 305         │
│  3rd Floor              │
│                         │
│  ┌─────────────────┐    │
│  │ I'm On My Way ✓ │    │
│  └─────────────────┘    │
│                         │
└─────────────────────────┘
```
- Plays sound
- Vibrates
- Sends push notification if backgrounded
- Full-screen indigo/green background

---

---

# SECTION 7 — COMPLETE USER WORKFLOWS

---

## Workflow 1 — Patient First Visit

```
1. Open app → /login
2. First time? → /register
3. Fill registration form → Submit
4. /verify-otp — Enter 6-digit code
5. Redirect to /patient (Dashboard)
6. Click "Join Queue" → /patient/queue/join
7. Select department → Browse doctors → Click "Join"
8. Confirm modal → Token assigned (e.g., A-42)
9. Redirect to /patient/queue — Watch live position
10. When called → Full-screen alert "YOU'VE BEEN CALLED!"
11. Doctor sees ECG, issues prescription
12. Patient gets notification → /patient/prescriptions
```

## Workflow 2 — Book Appointment

```
1. Patient Dashboard → [Book Appointment]
2. /patient/appointments/book
3. Step 1: Select department
4. Step 2: Select doctor
5. Step 3: Select date (calendar)
6. Step 4: Select time slot
7. Step 5: Review + add reason → [Confirm]
8. Success screen → Token number shown
9. Email + SMS confirmation sent
10. Token added to upcoming appointments list
```

## Workflow 3 — Doctor Calls Next Patient

```
1. Doctor Dashboard → Current patient card
2. Click [Complete Consultation] → Modal
3. Fill diagnosis notes → Toggle prescription/labs
4. Click [Complete & Call Next]
5. System:
   - Marks current patient "completed"
   - Sends notification to next patient
   - WebSocket emits "token-called" event
6. Next patient sees alert on their device
7. Doctor's screen updates with new current patient
```

## Workflow 4 — Patient Grants Record Access

```
1. Patient receives notification: "Dr. Verma requests access"
2. Open /patient/consent
3. View request: what records, what duration
4. Click [Grant Access] → Confirm modal
5. System records consent with expiry
6. Doctor's PatientRecords screen unlocks
7. Every access automatically logged to AuditLog
```

## Workflow 5 — Emergency Override Flow

```
1. Doctor views patient → No consent → "Records Locked"
2. Life-threatening situation → Click [Emergency Override]
3. Warning screen → "This will be logged + reviewed"
4. Doctor checks "I confirm emergency" → [Continue]
5. Justification form → Select emergency type + write reason
6. [Grant Emergency Access] → Access unlocked immediately
7. Patient receives immediate notification (automated)
8. Admin dashboard shows new "Pending Review" alert
9. Admin reviews within 24h → Approve / Reject / Flag
10. Doctor notified of review outcome
```

## Workflow 6 — Admin Reviews Emergency Access

```
1. Admin Dashboard → "3 Pending Emergency Reviews"
2. Click [Review Now] → /admin/emergency-access
3. Full detail screen:
   - Doctor + Patient info
   - Emergency type + justification
   - Records accessed (list)
   - Timeline of events
   - Verification checklist
4. Admin checks boxes → Select decision
5. Add admin notes → [Submit Review]
6. Doctor + Patient notified of outcome
7. Audit log updated
```

---

---

# SECTION 8 — COMPONENT REFERENCE

---

## Reusable Components

| Component | Description | Used On |
|---|---|---|
| `TokenCard` | Large token number display with status and wait time | Patient Dashboard, Queue Tracking |
| `QueueItem` | Single queue entry row — token, name, status, actions | Doctor Queue, Patient Queue |
| `AppointmentCard` | Appointment with doctor info, status badge, actions | Patient Appointments, Doctor Appointments |
| `RecordCard` | Medical record with type icon, meta info, file actions | Health Vault, Patient Records |
| `StatusBadge` | Colored pill: waiting/in-progress/completed/cancelled | Everywhere |
| `NotificationItem` | Single notification with icon, text, timestamp, actions | Notification Center, Bell dropdown |
| `ConsentCard` | Access grant card with doctor, records, expiry, revoke | Consent Management |
| `UserRow` | Table row for user list — avatar, role, status, actions | Admin User Management |
| `EmergencyAlert` | Red alert banner shown during emergency access | Patient Records (Doctor View) |
| `SystemHealthCard` | Icon + status + metric for API/DB/Socket | Admin Dashboard |
| `StatCard` | Large number + label + optional trend | All Dashboards |

## Common Modal Patterns

1. **Confirm Modal** — Title + description + Cancel + Confirm CTA
2. **Form Modal** — Title + form fields + Cancel + Submit CTA
3. **Detail Drawer** — Slides in from right, overlay background, close button
4. **Alert Modal** — Icon + message + single action (full-screen on mobile for critical alerts)
5. **Preview Modal** — Shows document/prescription preview with download option

---

---

# QUICK SUMMARY TABLE

| Screen ID | Name | Role | URL |
|---|---|---|---|
| A1 | Login | Public | `/login` |
| A2 | Register | Public | `/register` |
| A3 | Verify OTP | Public | `/verify-otp` |
| A4 | Forgot Password | Public | `/forgot-password` |
| A5 | Reset Password | Public | `/reset-password` |
| P1 | Patient Dashboard | Patient | `/patient` |
| P2 | Join Queue | Patient | `/patient/queue/join` |
| P3 | Live Queue Tracking | Patient | `/patient/queue` |
| P4 | Book Appointment | Patient | `/patient/appointments/book` |
| P5 | Appointments List | Patient | `/patient/appointments` |
| P6 | Health Vault | Patient | `/patient/records` |
| P7 | Consent Management | Patient | `/patient/consent` |
| P8 | Prescriptions | Patient | `/patient/prescriptions` |
| D1 | Doctor Dashboard | Doctor | `/doctor` |
| D2 | Queue Management | Doctor | `/doctor/queue` |
| D3 | Patient Records | Doctor | `/doctor/patients/:id/records` |
| D4 | Create Prescription | Doctor | `/doctor/prescriptions/create` |
| D5 | Emergency Requests | Doctor | `/doctor/emergency-requests` |
| D6 | Doctor Appointments | Doctor | `/doctor/appointments` |
| AD1 | Admin Dashboard | Admin | `/admin` |
| AD2 | User Management | Admin | `/admin/users` |
| AD3 | Audit Logs | Admin | `/admin/audit` |
| AD4 | Emergency Access Review | Admin | `/admin/emergency-access` |
| AD5 | Analytics | Admin | `/admin/analytics` |
| AD6 | Emergency Cases | Admin | `/admin/emergency-cases` |
| S1 | Profile | All | `/:role/profile` |
| S2 | Notifications | All | `/:role/notifications` |
| S3 | Help & Support | All | `/:role/help` |

---

*MediQueue — CareQueue + Health-Vault*  
*Total screens: 28 · Roles: Patient, Doctor, Admin*
