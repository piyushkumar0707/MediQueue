# CareQueue + Health-Vault

A secure healthcare operations platform combining real-time patient queue management with consent-based, encrypted medical records.

## 🏥 Features

### CareQueue
- Real-time patient queue & appointment management
- Live queue tracking with WebSocket
- Smart waiting time estimation
- Multi-department support

### Health-Vault
- Consent-based medical records access
- End-to-end encryption
- Comprehensive audit logging
- Emergency override with accountability

## 👥 User Roles

- **Patient**: Book appointments, track queue, manage medical records
- **Doctor**: Manage consultations, access patient records, write prescriptions
- **Admin**: System oversight, audit logs, user management, analytics

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- TypeScript
- Tailwind CSS
- React Router v6
- Socket.io Client
- Axios
- Zustand (State Management)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io (Real-time)
- JWT Authentication
- Bcrypt (Password Hashing)
- Multer (File Upload)

## 📁 Project Structure

```
care-vault/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Custom middleware
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── utils/       # Helper functions
│   │   └── server.js    # Entry point
│   └── package.json
│
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── hooks/       # Custom hooks
│   │   ├── store/       # State management
│   │   ├── utils/       # Utilities
│   │   └── App.jsx      # Root component
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd care-vault
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
- Copy `.env.example` to `.env` in both frontend and backend
- Update the values according to your setup

5. Start MongoDB
```bash
mongod
```

6. Start the backend server
```bash
cd backend
npm run dev
```

7. Start the frontend development server
```bash
cd frontend
npm run dev
```

## 🔐 Security Features

- Multi-Factor Authentication (OTP)
- Role-Based Access Control (RBAC)
- End-to-end encryption for medical records
- Session management with JWT
- Comprehensive audit logging
- Emergency override with justification tracking

## 📊 Key Workflows

### Patient Journey
1. Register/Login with MFA
2. Book appointment or join queue
3. Track queue position in real-time
4. Get notified when called
5. Upload and manage medical records
6. Grant/revoke doctor access to records

### Doctor Workflow
1. Login to doctor dashboard
2. View today's queue
3. Call next patient
4. Request patient record access
5. View records (with consent or emergency override)
6. Complete consultation and write prescription

### Admin Functions
1. Monitor system health
2. Review emergency access logs
3. Manage users and roles
4. View analytics and reports
5. Ensure compliance

## 📝 License

This project is proprietary and confidential.

## 👨‍💻 Development Team

Developed for secure healthcare operations.
