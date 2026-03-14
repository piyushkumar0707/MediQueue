import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication
      'LOGIN',
      'LOGOUT',
      'LOGIN_FAILED',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET',
      'OTP_SENT',
      'OTP_VERIFIED',
      
      // User Management
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_STATUS_CHANGED',
      'PROFILE_UPDATED',
      
      // Appointments
      'APPOINTMENT_CREATED',
      'APPOINTMENT_UPDATED',
      'APPOINTMENT_CANCELLED',
      'APPOINTMENT_COMPLETED',
      'APPOINTMENT_RESCHEDULED',
      
      // Queue
      'QUEUE_ENTRY_CREATED',
      'QUEUE_ENTRY_UPDATED',
      'QUEUE_PATIENT_CALLED',
      'QUEUE_ENTRY_COMPLETED',
      
      // Prescriptions
      'PRESCRIPTION_CREATED',
      'PRESCRIPTION_VIEWED',
      'PRESCRIPTION_UPDATED',
      'PRESCRIPTION_DELETED',
      
      // Health Records (HIPAA Critical)
      'RECORD_ACCESSED',
      'RECORD_CREATED',
      'RECORD_UPDATED',
      'RECORD_DELETED',
      'RECORD_DOWNLOADED',
      'RECORD_UPLOADED',
      'RECORD_SHARED',
      
      // AI Actions
      'AI_RECORD_SUMMARIZED',
      'CONSENT_REQUESTED',
      'CONSENT_GRANTED',
      'CONSENT_REVOKED',
      'CONSENT_EXPIRED',
      'CONSENT_VIEWED',
      
      // Emergency Override (HIPAA Critical)
      'EMERGENCY_ACCESS_CREATED',
      'EMERGENCY_ACCESS_USED',
      'EMERGENCY_ACCESS_REVIEWED',
      'EMERGENCY_ACCESS_APPROVED',
      'EMERGENCY_ACCESS_REJECTED',
      
      // Notifications
      'NOTIFICATION_SENT',
      'NOTIFICATION_READ',
      
      // System
      'SYSTEM_CONFIG_CHANGED',
      'BULK_OPERATION',
      'EXPORT_GENERATED',
      'REPORT_GENERATED'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: [
      'AUTH',
      'USER_MANAGEMENT',
      'APPOINTMENT',
      'QUEUE',
      'PRESCRIPTION',
      'RECORD',
      'CONSENT',
      'EMERGENCY',
      'NOTIFICATION',
      'SYSTEM',
      'PROFILE'
    ]
  },
  description: {
    type: String,
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetResource: {
    type: String // e.g., 'Appointment', 'Queue', 'User'
  },
  targetResourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING'],
    default: 'SUCCESS'
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  // HIPAA Compliance Fields
  isHIPAARelevant: {
    type: Boolean,
    default: false
  },
  dataAccessed: {
    type: [String], // Types of PHI accessed
    default: []
  },
  accessReason: {
    type: String // Reason for accessing PHI
  },
  // Tamper Prevention
  hash: {
    type: String // SHA-256 hash of log entry for integrity verification
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetUserId: 1, createdAt: -1 });
auditLogSchema.index({ isHIPAARelevant: 1, createdAt: -1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

// Static methods for compliance reporting
auditLogSchema.statics.getHIPAALogs = function(startDate, endDate) {
  return this.find({
    isHIPAARelevant: true,
    createdAt: { $gte: startDate, $lte: endDate }
  })
  .populate('userId', 'email personalInfo role')
  .populate('targetUserId', 'email personalInfo')
  .sort({ createdAt: -1 });
};

auditLogSchema.statics.getEmergencyAccessReport = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        category: 'EMERGENCY',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          userId: '$userId'
        },
        count: { $sum: 1 },
        lastAccess: { $max: '$createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.userId',
        foreignField: '_id',
        as: 'user'
      }
    }
  ]);
};

auditLogSchema.statics.getRecordAccessReport = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        action: { $in: ['RECORD_ACCESSED', 'RECORD_DOWNLOADED', 'RECORD_VIEWED'] },
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          userId: '$userId',
          targetUserId: '$targetUserId'
        },
        accessCount: { $sum: 1 },
        lastAccess: { $max: '$createdAt' },
        actions: { $push: '$action' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.userId',
        foreignField: '_id',
        as: 'accessor'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.targetUserId',
        foreignField: '_id',
        as: 'patient'
      }
    }
  ]);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
