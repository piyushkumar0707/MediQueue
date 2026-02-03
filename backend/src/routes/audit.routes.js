import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getAuditLogs,
  getAuditStats,
  getUserActivityLogs,
  getSecurityEvents,
  getHIPAAComplianceReport,
  getEmergencyAccessReport,
  getRecordAccessReport,
  exportAuditLogs
} from '../controllers/audit.controller.js';

const router = express.Router();

// All routes require admin authorization
router.use(protect, authorize('admin'));

// GET /api/audit/logs - Get all audit logs with filters
router.get('/logs', getAuditLogs);

// GET /api/audit/stats - Get audit statistics
router.get('/stats', getAuditStats);

// GET /api/audit/security - Get security events
router.get('/security', getSecurityEvents);

// GET /api/audit/user/:userId - Get user activity logs
router.get('/user/:userId', getUserActivityLogs);

// Compliance Reports
router.get('/compliance/hipaa', getHIPAAComplianceReport);
router.get('/compliance/emergency', getEmergencyAccessReport);
router.get('/compliance/record-access', getRecordAccessReport);

// Export
router.get('/export', exportAuditLogs);

export default router;
