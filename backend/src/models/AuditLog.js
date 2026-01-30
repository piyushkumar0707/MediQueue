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
      'LOGIN',
      'LOGOUT',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_STATUS_CHANGED',
      'APPOINTMENT_CREATED',
      'APPOINTMENT_UPDATED',
      'APPOINTMENT_CANCELLED',
      'QUEUE_ENTRY_CREATED',
      'QUEUE_ENTRY_UPDATED',
      'PRESCRIPTION_CREATED',
      'PASSWORD_CHANGED',
      'PROFILE_UPDATED',
      'RECORD_ACCESSED',
      'RECORD_CREATED',
      'RECORD_UPDATED'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: ['AUTH', 'USER_MANAGEMENT', 'APPOINTMENT', 'QUEUE', 'PRESCRIPTION', 'RECORD', 'PROFILE']
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

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
