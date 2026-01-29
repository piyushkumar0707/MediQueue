import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAdminStats,
  getRecentUsers,
  getAllUsers,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser
} from '../controllers/admin.controller.js';

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

// Stats and dashboard
router.get('/stats', getAdminStats);
router.get('/recent-users', getRecentUsers);

// User management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
