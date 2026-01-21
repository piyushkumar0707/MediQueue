# Authentication Screens

Complete documentation for all authentication-related screens.

---

## 1. Splash / App Entry Screen

### Purpose
Initial loading screen shown when app launches.

### Layout
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│           [App Logo/Icon]               │
│                                         │
│       CareQueue + Health-Vault          │
│                                         │
│     Secure Healthcare Operations        │
│                                         │
│                                         │
│         [Loading spinner]               │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

### Components
- Logo/brand icon (centered, large)
- App name (H1, centered)
- Tagline (body text, muted)
- Loading spinner/animation

### Behavior
- Shows for 1-2 seconds
- Auto-redirects to:
  - Dashboard (if authenticated)
  - Login (if not authenticated)

### Colors
- White/light gray background
- Healthcare blue for logo/spinner

---

## 2. Login Screen

### Purpose
User authentication entry point.

### Layout
```
┌─────────────────────────────────────────────────┐
│  [Logo]        CareQueue + Health-Vault         │
├─────────────────────────────────────────────────┤
│                                                 │
│              Welcome Back                       │
│       Please sign in to continue                │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Email or Phone Number                │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Password                    [👁]     │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   [Forgot Password?]                           │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │         Sign In                       │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│           Don't have an account?               │
│         [Sign Up] | [Contact Admin]            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components
1. **Header**: Logo + App name
2. **Card** (centered, max-width 420px):
   - Heading: "Welcome Back" (H2)
   - Subtext: "Please sign in to continue"
   - Input: Email/Phone (with icon)
   - Input: Password (with show/hide toggle)
   - Link: "Forgot Password?" (right-aligned)
   - Button: "Sign In" (Primary, full-width)
   - Help text with links

### States
- Empty state
- Filled state
- Validation errors (inline, under fields)
- Loading state (button disabled + spinner)
- Failed login error (toast notification)

### Interactions
- Enter key submits form
- Show/hide password toggle
- "Forgot Password?" → Forgot Password screen
- "Sign Up" → Registration screen
- "Contact Admin" → Shows admin contact modal

### Validation
- Email/phone format check
- Password minimum length
- Show errors on blur or submit

---

## 3. Self-Service Registration

### Purpose
Allow new patients to create accounts.

### Layout
```
┌─────────────────────────────────────────────────┐
│  [←]           Create Account                   │
├─────────────────────────────────────────────────┤
│                                                 │
│            Join CareQueue                       │
│        Start managing your health today         │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Full Name                             │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Email Address                         │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Phone Number                          │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Password                    [👁]     │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Confirm Password            [👁]     │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   Password requirements:                       │
│   ✓ At least 8 characters                     │
│   ○ One uppercase letter                      │
│   ○ One number                                │
│                                                 │
│   □ I agree to Terms of Service and           │
│     Privacy Policy                             │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │        Create Account                 │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│       Already have an account? [Sign In]       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components
- Back button
- Full Name input
- Email input
- Phone input (with country code)
- Password input (with toggle)
- Confirm Password input
- Password requirements (live validation)
- Terms checkbox (required)
- Create Account button
- Sign In link

### Flow
1. User fills form
2. Clicks "Create Account"
3. Account created as **Patient role**
4. Goes to OTP verification
5. After OTP verified → Patient Dashboard

### Validation
- All fields required
- Email format validation
- Phone format validation
- Password strength (8+ chars, uppercase, number)
- Passwords must match
- Terms must be accepted

---

## 4. OTP Verification (MFA)

### Purpose
Two-factor authentication for all logins.

### Layout
```
┌─────────────────────────────────────────────────┐
│  [←]           Verify OTP                       │
├─────────────────────────────────────────────────┤
│                                                 │
│         Enter Verification Code                 │
│                                                 │
│      We sent a code to +91 98765 43210         │
│                                                 │
│   ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐   │
│   │ 1 │  │ 2 │  │ 3 │  │ 4 │  │ 5 │  │ 6 │   │
│   └───┘  └───┘  └───┘  └───┘  └───┘  └───┘   │
│                                                 │
│         Didn't receive code?                    │
│         [Resend OTP] (00:45)                   │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │         Verify & Continue             │    │
│   └──────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components
- Back button
- Heading + help text
- 6 OTP input boxes
- Resend link with countdown
- Verify button

### States
- Empty boxes (outlined)
- Filled boxes (solid)
- Error state (red border all boxes)
- Invalid code (shake animation + error)
- Countdown: "Resend OTP (00:45)"
- Resend enabled after countdown

### Interactions
- Auto-focus first box
- Auto-move to next box on input
- Paste support (6-digit code)
- Backspace moves to previous box
- Auto-submit when all 6 digits filled
- Resend OTP resets timer

### Security
- OTP expires after 5 minutes
- Maximum 3 attempts
- Rate limiting on resend

---

## 5. Forgot Password

### Purpose
Initiate password reset flow.

### Layout
```
┌─────────────────────────────────────────────────┐
│  [←]        Forgot Password                     │
├─────────────────────────────────────────────────┤
│                                                 │
│           Reset Your Password                   │
│                                                 │
│   Enter your email and we'll send you a        │
│   link to reset your password                  │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Email Address                         │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │        Send Reset Link                │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   [← Back to Login]                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components
- Back button
- Heading + instructions
- Email input
- Send button
- Back to Login link

### States
- Default
- Email sent success (green toast)
- Email not found (error under field)
- Loading state

### Behavior
- Sends password reset email
- Shows success message
- Email contains reset link (expires in 1 hour)

---

## 6. Reset Password

### Purpose
Create new password using reset token.

### Layout
```
┌─────────────────────────────────────────────────┐
│  [Logo]      Create New Password                │
├─────────────────────────────────────────────────┤
│                                                 │
│         Enter your new password                 │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ New Password              [👁]       │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │ Confirm Password          [👁]       │    │
│   └──────────────────────────────────────┘    │
│                                                 │
│   Password requirements:                       │
│   ✓ At least 8 characters                     │
│   ○ One uppercase letter                      │
│   ○ One number                                │
│   ○ One special character                     │
│                                                 │
│   ┌──────────────────────────────────────┐    │
│   │      Reset Password                   │    │
│   └──────────────────────────────────────┘    │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components
- Logo
- New Password input
- Confirm Password input
- Requirements checklist (live)
- Reset button

### States
- Requirements update real-time (✓ green, ○ gray)
- Password mismatch error
- Success → redirects to Login

### Validation
- 8+ characters
- Uppercase letter
- Number
- Special character
- Passwords match

---

## 7. Role Resolution Loader

### Purpose
Determine user role and redirect to appropriate dashboard.

### Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│                                                 │
│           [Animated spinner]                    │
│                                                 │
│          Setting up your dashboard...           │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components
- Loading spinner
- Status text

### Behavior
- Shown after login + OTP
- Fetches user role from API
- Redirects to:
  - `/patient` for Patient
  - `/doctor` for Doctor
  - `/admin` for Admin

### Duration
0.5-1 second

---

## 8. Session Expired Modal

### Purpose
Notify user of session expiration and require re-login.

### Layout
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   ┌───────────────────────────────────────┐   │
│   │  [⚠️]                                  │   │
│   │                                        │   │
│   │      Session Expired                   │   │
│   │                                        │   │
│   │  Your session has expired for         │   │
│   │  security reasons. Please log in      │   │
│   │  again to continue.                   │   │
│   │                                        │   │
│   │  ┌──────────────────────────────┐    │   │
│   │  │      Log In Again             │    │   │
│   │  └──────────────────────────────┘    │   │
│   │                                        │   │
│   └────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components
- Warning icon (amber)
- Heading
- Message text
- Log In Again button

### Behavior
- Cannot be dismissed (no X button)
- Button redirects to Login
- Clears all session data
- Shown when JWT expires

### Trigger Conditions
- JWT token expired
- Invalid token detected
- 30 minutes of inactivity
- Session revoked by admin

---

## Design Guidelines

### Security Indicators
- Lock icons for secure fields
- HTTPS badge
- Security messages
- Clear error messages

### Accessibility
- WCAG AA compliant
- Keyboard navigation
- Screen reader labels
- High contrast mode support
- Focus states on all interactive elements

### Mobile Responsiveness
- Single column layout on mobile
- Touch-friendly targets (44x44px minimum)
- Optimized input types (email, tel, number)
- Native mobile keyboards

### Error Handling
- Inline validation (on blur)
- Clear error messages
- Field-level errors
- Form-level errors
- Toast notifications for critical errors

---

## Security Features

1. **Password Requirements**
   - Minimum 8 characters
   - Mixed case letters
   - Numbers
   - Special characters

2. **Multi-Factor Authentication**
   - Mandatory OTP verification
   - SMS/Email delivery
   - 5-minute expiration
   - Rate limiting

3. **Session Management**
   - JWT with refresh tokens
   - 30-minute activity timeout
   - Secure token storage
   - Single device enforcement (optional)

4. **Rate Limiting**
   - Login attempts: 5 per 15 minutes
   - OTP requests: 3 per hour
   - Password reset: 3 per day

---

**End of Authentication Screens Documentation**
