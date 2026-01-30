import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { auditLogger } from '../middleware/auditLogger.js';
import {
  getAdminStats,
  getRecentUsers,
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
} from '../controllers/admin.controller.js';
import {
  getEmergencyCases,
  getEmergencyStats,
  updateEmergencyPriority,
  assignDoctorToEmergency,
  updateEmergencyStatus,
  getAvailableDoctors
} from '../controllers/emergency.controller.js';

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

// Stats and dashboard
router.get('/stats', getAdminStats);
router.get('/recent-users', getRecentUsers);

// User management
router.get('/users', getAllUsers);
router.post('/users', auditLogger('USER_CREATED', 'USER_MANAGEMENT'), createUser);
router.put('/users/:id', auditLogger('USER_UPDATED', 'USER_MANAGEMENT'), updateUser);
router.patch('/users/:id/status', auditLogger('USER_STATUS_CHANGED', 'USER_MANAGEMENT'), updateUserStatus);
router.delete('/users/:id', auditLogger('USER_DELETED', 'USER_MANAGEMENT'), deleteUser);

// Emergency management
router.get('/emergency', getEmergencyCases);
router.get('/emergency/stats', getEmergencyStats);
router.get('/emergency/available-doctors', getAvailableDoctors);
router.patch('/emergency/:id/priority', updateEmergencyPriority);
router.patch('/emergency/:id/assign', assignDoctorToEmergency);
router.patch('/emergency/:id/status', updateEmergencyStatus);

export default router;
