# Mobile App Screens

Complete documentation for mobile-responsive screens (iOS & Android).

---

## Screen Overview

1. Mobile Patient Dashboard
2. Mobile Queue Tracking
3. Mobile Notifications
4. Mobile Health Records
5. Mobile Appointment Booking
6. Mobile Doctor Queue View
7. Called Notification (Full-screen)

---

## Design Principles

### Mobile-First Approach
- Touch-friendly targets (minimum 44x44px)
- Bottom navigation for primary actions
- Swipe gestures for common actions
- Optimized for one-handed use
- Persistent bottom action buttons

### Performance
- Lazy loading for lists
- Image optimization
- Offline support for critical features
- Background sync for notifications

---

## 1. Mobile Patient Dashboard

```
┌─────────────────────────┐
│ ≡  CareQueue     🔔(3)  │ ← Header (fixed)
├─────────────────────────┤
│ 👋 Hello, Rajesh        │
│                         │
│ ┌─────────────────────┐ │
│ │ 🎫 Your Token       │ │ ← Hero Card
│ │                     │ │
│ │      A-38           │ │
│ │                     │ │
│ │ 🟢 Queue Position: 5│ │
│ │ ⏱️ Est. Wait: 15 min│ │
│ │                     │ │
│ │ [Track Live Queue]  │ │
│ └─────────────────────┘ │
│                         │
│ Quick Actions           │
│ ┌──────┐ ┌──────┐      │
│ │ 📅   │ │ 🏥   │      │
│ │ Book │ │ Queue│      │
│ └──────┘ └──────┘      │
│ ┌──────┐ ┌──────┐      │
│ │ 📁   │ │ 🔒   │      │
│ │Record│ │Consent│     │
│ └──────┘ └──────┘      │
│                         │
│ Upcoming Appointments   │
│ ┌─────────────────────┐ │
│ │ Dr. Sharma          │ │
│ │ 15 Jan • 10:30 AM   │ │
│ │ Cardiology          │ │
│ │ [View Details]      │ │
│ └─────────────────────┘ │
│                         │
├─────────────────────────┤
│ [🏠] [📅] [🎫] [📁] [👤]│ ← Bottom Nav (fixed)
└─────────────────────────┘
```

**Bottom Navigation:**
- 🏠 Home
- 📅 Appointments
- 🎫 Queue
- 📁 Health Records
- 👤 Profile

---

## 2. Mobile Queue Tracking

```
┌─────────────────────────┐
│ ← Live Queue    🔔(1)   │
├─────────────────────────┤
│ 🎫 YOUR TOKEN           │
│                         │
│       A-38              │
│                         │
│ ┌─────────────────────┐ │
│ │ Queue Position      │ │
│ │                     │ │
│ │        5            │ │ ← Large, bold
│ │                     │ │
│ │   of 23 waiting     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ ⏱️ Estimated Wait   │ │
│ │                     │ │
│ │     15 minutes      │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🩺 Doctor           │ │
│ │ Dr. Amit Sharma     │ │
│ │ Cardiology          │ │
│ └─────────────────────┘ │
│                         │
│ Status: 🟢 Active Queue │
│ Last updated: Just now  │
│                         │
│ [🔄 Refresh]            │
│                         │
│ ⚠️ Please be ready when │
│ called. Check-in Cabin 3│
│                         │
├─────────────────────────┤
│ [🏠] [📅] [🎫] [📁] [👤]│
└─────────────────────────┘
```

**Features:**
- Auto-refresh every 30 seconds
- WebSocket real-time updates
- Pull-to-refresh gesture
- Haptic feedback on position change
- Sound + vibration when called

---

## 3. Called Notification (Full-screen)

```
┌─────────────────────────┐
│                         │
│                         │
│         🔔              │
│                         │
│    YOU'RE CALLED!       │
│                         │
│                         │
│     Token: A-38         │
│                         │
│                         │
│  Please proceed to:     │
│                         │
│    Cabin 3              │
│    Cardiology           │
│                         │
│    Dr. Amit Sharma      │
│                         │
│                         │
│                         │
│ [I'm on my way! ✓]      │ ← Large, green button
│                         │
│                         │
│                         │
│    [Dismiss]            │ ← Small, text link
│                         │
└─────────────────────────┘
```

**Notification Behavior:**
- Takes over entire screen
- Cannot be dismissed easily (patient must acknowledge)
- Plays notification sound (even if phone is on silent)
- Vibrates continuously
- Shows until acknowledged
- Background: Bright color (yellow/green)

---

## 4. Mobile Health Records

```
┌─────────────────────────┐
│ ← Health Records 🔔(1)  │
├─────────────────────────┤
│ [Search records...]     │
│                         │
│ Filter: [All▾] [2024▾]  │
│                         │
│ ┌─────────────────────┐ │
│ │ 📄 Blood Test       │ │
│ │ 12 Jan 2024         │ │
│ │ Lab Report          │ │
│ │ [View] [Share]      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 💊 Prescription     │ │
│ │ 10 Jan 2024         │ │
│ │ Dr. Sharma          │ │
│ │ [View] [Share]      │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🩺 Consultation     │ │
│ │ 05 Jan 2024         │ │
│ │ Cardiology          │ │
│ │ [View] [Share]      │ │
│ └─────────────────────┘ │
│                         │
│ [+ Upload New Record]   │
│                         │
├─────────────────────────┤
│ [🏠] [📅] [🎫] [📁] [👤]│
└─────────────────────────┘
```

**Swipe Actions:**
- Swipe left: Delete
- Swipe right: Share
- Long press: Multi-select

**Record Detail View:**
- Full-screen PDF viewer
- Pinch to zoom
- Download option
- Share to email/WhatsApp

---

## 5. Mobile Appointment Booking

**Step-by-step flow optimized for mobile:**

```
┌─────────────────────────┐
│ ← Book Appointment      │
├─────────────────────────┤
│ Step 1 of 5             │
│ ━━━━━━━━━━━━━━━━━━━━━━ │ ← Progress bar
│                         │
│ Select Department       │
│                         │
│ ┌─────────────────────┐ │
│ │ ❤️ Cardiology       │ │ ← Card style
│ │ 3 doctors available │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🦴 Orthopedics      │ │
│ │ 2 doctors available │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ 🩺 General Medicine │ │
│ │ 5 doctors available │ │
│ └─────────────────────┘ │
│                         │
│ [View All Departments]  │
│                         │
├─────────────────────────┤
│        [Continue →]     │ ← Fixed bottom button
└─────────────────────────┘
```

**Mobile Optimizations:**
- One step per screen
- Large touch targets
- Fixed bottom CTA button
- Clear progress indicator
- Back navigation always available

---

## 6. Mobile Notifications

```
┌─────────────────────────┐
│ ← Notifications  [⚙️]   │
├─────────────────────────┤
│ Today                   │
│                         │
│ 🔴 YOU'RE CALLED!       │ ← High priority
│ Token A-38 • Cabin 3    │
│ 2 minutes ago           │
│                         │
│ ────────────────────    │
│                         │
│ 🟡 Queue Update         │ ← Medium priority
│ Position: 5 (was 8)     │
│ 15 minutes ago          │
│                         │
│ ────────────────────    │
│                         │
│ 🔵 Appointment Reminder │ ← Low priority
│ Tomorrow, 10:30 AM      │
│ Dr. Sharma              │
│ 1 hour ago              │
│                         │
│ ────────────────────    │
│                         │
│ Yesterday               │
│                         │
│ 🟢 Prescription Ready   │
│ Download available      │
│ [View]                  │
│                         │
├─────────────────────────┤
│ [🏠] [📅] [🎫] [📁] [👤]│
└─────────────────────────┘
```

**Notification Types:**
- 🔴 Called (high - full screen takeover)
- 🟡 Queue updates (medium - banner)
- 🔵 Appointments (low - badge)
- 🟢 Records/Prescriptions (info - badge)

---

## 7. Mobile Doctor Queue View

```
┌─────────────────────────┐
│ ≡  Dr. Sharma    🔔(5)  │
├─────────────────────────┤
│ 🎫 Current Patient      │
│                         │
│ Token: A-38             │
│ Rajesh Kumar (M, 45)    │
│ Complaint: Chest pain   │
│                         │
│ [View Records]          │
│ [Complete Consult]      │
│                         │
│ ────────────────────    │
│                         │
│ 📋 Today's Queue (5)    │
│                         │
│ 🟡 Next in Line         │
│ A-39 | Priya Singh      │
│ [Call] [Skip]           │
│                         │
│ ────────────────────    │
│                         │
│ 🟡 Waiting (4)          │
│ A-40 | Amit Patel       │
│ [Details]               │
│                         │
│ A-41 | Neha Gupta       │
│ [Details]               │
│                         │
│ [View All (2 more)]     │
│                         │
│ ────────────────────    │
│                         │
│ [⏸️ Pause Queue]        │
│                         │
├─────────────────────────┤
│ [📋] [👥] [💊] [⚙️]     │ ← Doctor bottom nav
└─────────────────────────┘
```

**Quick Actions:**
- Swipe patient card right: Call
- Swipe patient card left: Skip
- Long press: View full details

---

## Mobile Features Summary

### Push Notifications
- Called notification (critical)
- Queue position updates
- Appointment reminders
- Prescription ready

### Offline Support
- View downloaded records
- Queue position cached
- Appointment list cached
- Sync when online

### Gestures
- Pull to refresh
- Swipe for actions
- Pinch to zoom (PDFs)
- Long press for options

### Accessibility
- Large text support
- VoiceOver/TalkBack
- High contrast mode
- Haptic feedback

### Performance
- Image lazy loading
- Progressive web app (PWA)
- Background sync
- Service worker caching

---

## Mobile Navigation Patterns

### Patient Bottom Nav
```
[🏠 Home] [📅 Appts] [🎫 Queue] [📁 Records] [👤 Profile]
```

### Doctor Bottom Nav
```
[📋 Queue] [👥 Patients] [💊 Prescriptions] [⚙️ Settings]
```

### Back Navigation
- Always show back arrow
- Support Android back button
- Breadcrumbs for deep navigation

---

## Mobile Responsive Breakpoints

- **Small phones**: 320px - 375px
- **Standard phones**: 376px - 414px
- **Large phones**: 415px - 767px
- **Tablets**: 768px+ (use desktop layout)

---

## Platform-Specific Considerations

### iOS
- iOS 14+ support
- Face ID / Touch ID for login
- Apple Push Notification Service (APNS)
- Haptic Engine integration
- Share Sheet for records

### Android
- Android 9+ support
- Biometric authentication
- Firebase Cloud Messaging (FCM)
- Material Design 3 components
- Android Share dialog

---

**End of Mobile Screens Documentation**

For detailed layouts and implementation guides, refer to the full conversation history or request specific screen details.
