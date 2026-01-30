import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAnalyticsOverview,
  getUserGrowth,
  getAppointmentTrends,
  getQueuePerformance,
  getDoctorPerformance
} from '../controllers/analytics.controller.js';

const router = express.Router();

// All routes require admin role
router.use(protect, authorize('admin'));

router.get('/overview', getAnalyticsOverview);
router.get('/user-growth', getUserGrowth);
router.get('/appointment-trends', getAppointmentTrends);
router.get('/queue-performance', getQueuePerformance);
router.get('/doctor-performance', getDoctorPerformance);

export default router;
