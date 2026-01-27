import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layouts
import AuthLayout from './components/layouts/AuthLayout';
import PatientLayout from './components/layouts/PatientLayout';
import DoctorLayout from './components/layouts/DoctorLayout';
import AdminLayout from './components/layouts/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import QueueTracking from './pages/patient/QueueTracking';
import JoinQueue from './pages/patient/JoinQueue';
import BookAppointment from './pages/patient/BookAppointment';
import HealthVault from './pages/patient/HealthVault';
import ConsentManagement from './pages/patient/ConsentManagement';
import PatientPrescriptions from './pages/patient/Prescriptions';

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import QueueManagement from './pages/doctor/QueueManagement';
import PatientRecords from './pages/doctor/PatientRecords';
import DoctorPrescriptions from './pages/doctor/PrescriptionsList';
import CreatePrescription from './pages/doctor/CreatePrescription';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AuditLogs from './pages/admin/AuditLogs';
import EmergencyReview from './pages/admin/EmergencyReview';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';

// Shared Pages
import Profile from './pages/Profile';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <Routes>
        {/* Public Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Patient Routes */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute role="patient">
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientDashboard />} />
          <Route path="queue" element={<QueueTracking />} />
          <Route path="queue/join" element={<JoinQueue />} />
          <Route path="appointments/book" element={<BookAppointment />} />
          <Route path="records" element={<HealthVault />} />
          <Route path="consent" element={<ConsentManagement />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Doctor Routes */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute role="doctor">
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="queue" element={<QueueManagement />} />
          <Route path="patients/:patientId/records" element={<PatientRecords />} />
          <Route path="prescriptions" element={<DoctorPrescriptions />} />
          <Route path="prescriptions/create" element={<CreatePrescription />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="emergency-review" element={<EmergencyReview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
