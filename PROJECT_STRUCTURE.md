# CareQueue + Health-Vault - Project Structure

## Complete File Structure

```
care-vault/
│
├── README.md
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   │
│   ├── src/
│   │   ├── server.js                 # Entry point
│   │   │
│   │   ├── config/
│   │   │   └── database.js           # MongoDB connection
│   │   │
│   │   ├── controllers/
│   │   │   └── auth.controller.js    # Auth logic
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── errorHandler.js       # Error handling
│   │   │   └── validate.js           # Validation middleware
│   │   │
│   │   ├── models/                   # Mongoose models (to be created)
│   │   │   ├── User.js
│   │   │   ├── Appointment.js
│   │   │   ├── Queue.js
│   │   │   ├── MedicalRecord.js
│   │   │   ├── Consent.js
│   │   │   ├── Prescription.js
│   │   │   └── AuditLog.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── appointment.routes.js
│   │   │   ├── queue.routes.js
│   │   │   ├── record.routes.js
│   │   │   ├── consent.routes.js
│   │   │   ├── prescription.routes.js
│   │   │   ├── audit.routes.js
│   │   │   └── analytics.routes.js
│   │   │
│   │   ├── services/                 # Business logic (to be created)
│   │   │   ├── email.service.js
│   │   │   ├── sms.service.js
│   │   │   ├── encryption.service.js
│   │   │   └── socket.service.js
│   │   │
│   │   └── utils/
│   │       └── logger.js             # Winston logger
│   │
│   └── logs/                         # Log files (auto-generated)
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    ├── index.html
    │
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        │
        ├── components/
        │   ├── auth/
        │   │   └── ProtectedRoute.jsx
        │   │
        │   ├── layouts/
        │   │   ├── AuthLayout.jsx
        │   │   ├── PatientLayout.jsx
        │   │   ├── DoctorLayout.jsx
        │   │   └── AdminLayout.jsx
        │   │
        │   ├── navigation/
        │   │   ├── PatientNavbar.jsx
        │   │   ├── DoctorSidebar.jsx
        │   │   └── AdminSidebar.jsx
        │   │
        │   ├── common/              # Reusable components (to be created)
        │   │   ├── Button.jsx
        │   │   ├── Input.jsx
        │   │   ├── Card.jsx
        │   │   ├── Modal.jsx
        │   │   ├── Badge.jsx
        │   │   └── Loader.jsx
        │   │
        │   └── features/            # Feature-specific components
        │       ├── queue/
        │       ├── appointments/
        │       ├── records/
        │       └── prescriptions/
        │
        ├── pages/
        │   ├── auth/
        │   │   ├── Login.jsx
        │   │   ├── Register.jsx
        │   │   ├── VerifyOTP.jsx
        │   │   ├── ForgotPassword.jsx
        │   │   └── ResetPassword.jsx
        │   │
        │   ├── patient/
        │   │   ├── Dashboard.jsx
        │   │   ├── QueueTracking.jsx
        │   │   ├── BookAppointment.jsx
        │   │   ├── HealthVault.jsx
        │   │   └── ConsentManagement.jsx
        │   │
        │   ├── doctor/
        │   │   ├── Dashboard.jsx
        │   │   ├── QueueManagement.jsx
        │   │   ├── PatientRecords.jsx
        │   │   └── Prescriptions.jsx
        │   │
        │   └── admin/
        │       ├── Dashboard.jsx
        │       ├── AuditLogs.jsx
        │       ├── EmergencyReview.jsx
        │       ├── UserManagement.jsx
        │       └── Analytics.jsx
        │
        ├── services/                # API calls (to be created)
        │   ├── api.js
        │   ├── auth.service.js
        │   ├── appointment.service.js
        │   ├── queue.service.js
        │   ├── record.service.js
        │   └── socket.service.js
        │
        ├── hooks/                   # Custom hooks (to be created)
        │   ├── useAuth.js
        │   ├── useQueue.js
        │   ├── useSocket.js
        │   └── useNotification.js
        │
        ├── store/
        │   └── authStore.js         # Zustand store
        │
        ├── utils/                   # Helper functions (to be created)
        │   ├── formatDate.js
        │   ├── validation.js
        │   └── constants.js
        │
        └── assets/                  # Static assets
            ├── images/
            └── icons/
```

## Tech Stack Summary

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + Bcrypt
- **Real-time**: Socket.io
- **Email**: NodeMailer
- **SMS**: Twilio
- **Logging**: Winston
- **Validation**: Express Validator

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form
- **Notifications**: React Toastify
- **Charts**: Recharts

## Next Steps

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Set Up Environment Variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start MongoDB
```bash
mongod
```

### 4. Start Development Servers

**Backend (Terminal 1):**
```bash
cd backend
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## What's Implemented

✅ Complete project structure
✅ Backend server with Express
✅ Database configuration
✅ Authentication routes
✅ Middleware (auth, error handling, validation)
✅ Frontend with React + Vite
✅ Tailwind CSS configuration
✅ React Router setup with protected routes
✅ Layout components (Auth, Patient, Doctor, Admin)
✅ Navigation components
✅ Placeholder pages for all features
✅ Zustand state management
✅ Environment configuration templates

## What Needs to Be Built

### Backend
- [ ] Database models (User, Appointment, Queue, etc.)
- [ ] Controller implementations
- [ ] Business logic services
- [ ] File upload handling
- [ ] Email/SMS services
- [ ] Socket.io event handlers
- [ ] Encryption service

### Frontend
- [ ] Common UI components (Button, Input, Modal, etc.)
- [ ] Feature-specific components
- [ ] API service implementations
- [ ] Custom hooks
- [ ] Complete page implementations
- [ ] Form validation
- [ ] Real-time updates with Socket.io
- [ ] File upload functionality

### Features to Implement
1. **Authentication Flow** (Login, Register, OTP, Password Reset)
2. **Patient Features** (Dashboard, Queue, Appointments, Records, Consent)
3. **Doctor Features** (Queue Management, Patient Records, Prescriptions)
4. **Admin Features** (Audit Logs, Emergency Review, User Management, Analytics)
5. **Real-time Queue Updates** (WebSocket)
6. **File Upload/Download** (Medical Records)
7. **Notifications System**
8. **Analytics Dashboard**

## Development Workflow

1. **Start with Authentication**
   - Implement user registration and login
   - Add OTP verification
   - Set up JWT token management

2. **Build Core Features**
   - Patient queue management
   - Appointment booking
   - Medical records upload

3. **Add Advanced Features**
   - Consent management
   - Emergency override
   - Audit logging

4. **Polish and Test**
   - Add comprehensive error handling
   - Implement security measures
   - Write tests
   - Optimize performance

## Security Considerations

- JWT tokens with refresh mechanism
- Password hashing with bcrypt
- Input validation on all endpoints
- Rate limiting
- CORS configuration
- Helmet for security headers
- File upload restrictions
- SQL injection prevention (using Mongoose)
- XSS protection

The project structure is now complete and ready for development! 🚀
