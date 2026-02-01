import express from 'express';
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getNotificationStats
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all notifications for current user
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Mark all as read
router.patch('/mark-all-read', markAllAsRead);

// Clear all read notifications
router.delete('/clear-read', clearReadNotifications);

// Create notification (typically used by system/admin)
router.post('/', createNotification);

// Get notification by ID
router.get('/:id', getNotificationById);

// Mark as read/unread
router.patch('/:id/read', markAsRead);
router.patch('/:id/unread', markAsUnread);

// Delete notification
router.delete('/:id', deleteNotification);

export default router;
