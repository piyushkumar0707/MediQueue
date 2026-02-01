import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import notificationService from '../services/notificationService.js';

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private
export const createNotification = asyncHandler(async (req, res) => {
  const {
    recipient,
    type,
    title,
    message,
    priority,
    relatedEntity,
    actionUrl,
    channels,
    metadata
  } = req.body;

  const notification = await Notification.createNotification({
    recipient,
    sender: req.user.userId,
    type,
    title,
    message,
    priority: priority || 'medium',
    relatedEntity,
    actionUrl,
    channels: channels || { inApp: true, email: false, sms: false },
    metadata
  });

  // Populate sender info
  await notification.populate('sender', 'personalInfo.firstName personalInfo.lastName email role');

  // Send notification through all channels (Socket.io, email, SMS)
  await notificationService.sendNotification(notification);

  res.status(201).json({
    success: true,
    data: notification
  });
});

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    priority,
    isRead,
    sortBy
  } = req.query;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    type,
    priority,
    sortBy: sortBy || '-createdAt'
  };

  // Convert isRead query param to boolean
  if (isRead !== undefined) {
    options.isRead = isRead === 'true';
  }

  const result = await Notification.getForUser(req.user.userId, options);

  res.json({
    success: true,
    data: {
      notifications: result.notifications,
      currentPage: result.pagination.page,
      totalPages: result.pagination.pages,
      total: result.pagination.total
    }
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.getUnreadCount(req.user.userId);

  res.json({
    success: true,
    data: { count }
  });
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
export const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)
    .populate('sender', 'personalInfo.firstName personalInfo.lastName email role')
    .populate('recipient', 'personalInfo.firstName personalInfo.lastName email');

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if user is the recipient
  if (notification.recipient._id.toString() !== req.user.userId) {
    res.status(403);
    throw new Error('Not authorized to view this notification');
  }

  res.json({
    success: true,
    data: notification
  });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if user is the recipient
  if (notification.recipient.toString() !== req.user.userId) {
    res.status(403);
    throw new Error('Not authorized to update this notification');
  }

  await notification.markAsRead();

  // Get updated unread count and emit to user
  const unreadCount = await Notification.getUnreadCount(req.user.userId);
  notificationService.emitUnreadCount(req.user.userId, unreadCount);

  res.json({
    success: true,
    data: notification
  });
});

// @desc    Mark notification as unread
// @route   PATCH /api/notifications/:id/unread
// @access  Private
export const markAsUnread = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if user is the recipient
  if (notification.recipient.toString() !== req.user.userId) {
    res.status(403);
    throw new Error('Not authorized to update this notification');
  }

  await notification.markAsUnread();

  // Get updated unread count and emit to user
  const unreadCount = await Notification.getUnreadCount(req.user.userId);
  notificationService.emitUnreadCount(req.user.userId, unreadCount);

  res.json({
    success: true,
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/mark-all-read
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await Notification.markAllAsRead(req.user.userId);

  // Emit updated unread count (should be 0)
  notificationService.emitUnreadCount(req.user.userId, 0);

  res.json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
    data: { modifiedCount: result.modifiedCount }
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if user is the recipient
  if (notification.recipient.toString() !== req.user.userId) {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }

  await notification.deleteOne();

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
export const clearReadNotifications = asyncHandler(async (req, res) => {
  const result = await Notification.deleteMany({
    recipient: req.user.userId,
    isRead: true
  });

  res.json({
    success: true,
    message: `${result.deletedCount} notifications deleted`,
    data: { deletedCount: result.deletedCount }
  });
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
export const getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const [total, unread, byType, byPriority] = await Promise.all([
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, isRead: false }),
    Notification.aggregate([
      { $match: { recipient: userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Notification.aggregate([
      { $match: { recipient: userId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      total,
      unread,
      read: total - unread,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    }
  });
});
