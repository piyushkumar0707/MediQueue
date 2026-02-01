import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient of the notification
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Sender of the notification (optional - system notifications won't have sender)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Type of notification
  type: {
    type: String,
    required: true,
    enum: [
      'consent_request',        // Doctor requests consent
      'consent_granted',        // Patient grants consent
      'consent_revoked',        // Patient revokes consent
      'emergency_access',       // Emergency access created
      'emergency_flagged',      // Emergency access flagged for review
      'emergency_reviewed',     // Admin reviewed emergency access
      'appointment_booked',     // New appointment booked
      'appointment_reminder',   // Appointment reminder
      'appointment_cancelled',  // Appointment cancelled
      'appointment_rescheduled',// Appointment rescheduled
      'prescription_created',   // New prescription created
      'prescription_ready',     // Prescription ready for pickup
      'record_shared',          // Medical record shared
      'record_accessed',        // Record accessed (via emergency)
      'message_received',       // New message received
      'queue_update',           // Queue status update
      'system_alert',           // System-wide alert
      'profile_update'          // Profile updated
    ],
    index: true
  },
  
  // Notification title
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  // Notification message/description
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Read at timestamp
  readAt: {
    type: Date
  },
  
  // Related entity (optional)
  relatedEntity: {
    entityType: {
      type: String,
      enum: [
        'appointment',
        'prescription',
        'consent',
        'emergency_access',
        'medical_record',
        'message',
        'queue',
        'user'
      ]
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },
  
  // Action URL (where to navigate when clicked)
  actionUrl: {
    type: String
  },
  
  // Notification channels
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  
  // Email sent status
  emailSent: {
    type: Boolean,
    default: false
  },
  
  // SMS sent status
  smsSent: {
    type: Boolean,
    default: false
  },
  
  // Metadata for additional information
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Expiry date (auto-delete after this date)
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, priority: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true } } });

// Instance Methods

// Mark notification as read
notificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Mark notification as unread
notificationSchema.methods.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  return await this.save();
};

// Static Methods

// Get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Get all notifications for a user with pagination
notificationSchema.statics.getForUser = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type,
    priority,
    isRead,
    sortBy = '-createdAt'
  } = options;

  const query = { recipient: userId };
  
  if (type) query.type = type;
  if (priority) query.priority = priority;
  if (typeof isRead === 'boolean') query.isRead = isRead;

  const notifications = await this.find(query)
    .populate('sender', 'personalInfo.firstName personalInfo.lastName email role')
    .sort(sortBy)
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

  const total = await this.countDocuments(query);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { 
      $set: { 
        isRead: true, 
        readAt: new Date() 
      } 
    }
  );
};

// Delete old read notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return await this.deleteMany({
    isRead: true,
    readAt: { $lt: cutoffDate }
  });
};

// Create notification helper
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  return await notification.save();
};

// Bulk create notifications
notificationSchema.statics.createBulkNotifications = async function(notificationsData) {
  return await this.insertMany(notificationsData);
};

// Virtual for time elapsed since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
});

// Ensure virtuals are included in JSON
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
