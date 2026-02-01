import mongoose from 'mongoose';

const emergencyAccessSchema = new mongoose.Schema({
  // Who is requesting emergency access
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor reference is required'],
    index: true
  },
  // Whose records are being accessed
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required'],
    index: true
  },
  // Emergency details
  emergencyType: {
    type: String,
    enum: [
      'life-threatening',
      'critical-care',
      'trauma',
      'cardiac-emergency',
      'stroke',
      'severe-allergic-reaction',
      'unconscious-patient',
      'other-emergency'
    ],
    required: [true, 'Emergency type is required']
  },
  justification: {
    type: String,
    required: [true, 'Justification is required'],
    trim: true,
    minlength: [20, 'Justification must be at least 20 characters'],
    maxlength: [1000, 'Justification cannot exceed 1000 characters']
  },
  // Location and context
  location: {
    type: String,
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  facilityName: {
    type: String,
    trim: true,
    maxlength: [200, 'Facility name cannot exceed 200 characters']
  },
  // Status workflow
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'revoked', 'denied'],
    default: 'active', // Auto-approved for emergency, but requires review
    index: true
  },
  // Access period
  requestedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default: 24 hours from request
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  },
  // Admin review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Review notes cannot exceed 500 characters']
  },
  reviewDecision: {
    type: String,
    enum: ['approved', 'flagged', 'revoked', 'legitimate']
  },
  // Revocation
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revocationReason: String,
  // Patient notification
  patientNotified: {
    type: Boolean,
    default: false
  },
  patientNotifiedAt: Date,
  notificationMethod: {
    type: String,
    enum: ['email', 'sms', 'in-app', 'multiple']
  },
  // Access log - What records were accessed during emergency
  accessLog: [{
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord'
    },
    recordType: String,
    action: {
      type: String,
      enum: ['viewed', 'downloaded', 'shared']
    },
    accessedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  // IP and device tracking
  requestIpAddress: String,
  requestUserAgent: String,
  // Risk assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  flaggedForReview: {
    type: Boolean,
    default: false
  },
  flaggedReason: String
}, {
  timestamps: true
});

// Indexes
emergencyAccessSchema.index({ doctor: 1, status: 1 });
emergencyAccessSchema.index({ patient: 1, status: 1 });
emergencyAccessSchema.index({ status: 1, reviewedAt: 1 });
emergencyAccessSchema.index({ expiresAt: 1 });
emergencyAccessSchema.index({ flaggedForReview: 1, status: 1 });

// Virtual - Check if access is currently valid
emergencyAccessSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         this.expiresAt > now;
});

// Instance Methods

// Log access to a specific record
emergencyAccessSchema.methods.logAccess = function(recordId, recordType, action, ipAddress) {
  this.accessLog.push({
    recordId,
    recordType,
    action,
    accessedAt: new Date(),
    ipAddress
  });
  return this.save();
};

// Revoke emergency access
emergencyAccessSchema.methods.revoke = function(revokedBy, reason) {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revocationReason = reason;
  return this.save();
};

// Mark as reviewed by admin
emergencyAccessSchema.methods.markReviewed = function(reviewerId, decision, notes) {
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  this.reviewDecision = decision;
  this.reviewNotes = notes;
  
  if (decision === 'revoked') {
    this.status = 'revoked';
    this.revokedAt = new Date();
    this.revokedBy = reviewerId;
  }
  
  return this.save();
};

// Mark patient as notified
emergencyAccessSchema.methods.markPatientNotified = function(method) {
  this.patientNotified = true;
  this.patientNotifiedAt = new Date();
  this.notificationMethod = method;
  return this.save();
};

// Static Methods

// Check if doctor has active emergency access to patient
emergencyAccessSchema.statics.hasActiveAccess = async function(doctorId, patientId) {
  const access = await this.findOne({
    doctor: doctorId,
    patient: patientId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
  
  return !!access;
};

// Get active emergency access
emergencyAccessSchema.statics.getActiveAccess = function(doctorId, patientId) {
  return this.findOne({
    doctor: doctorId,
    patient: patientId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
};

// Expire old emergency accesses (cron job)
emergencyAccessSchema.statics.expireOldAccesses = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lte: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  
  return result.modifiedCount;
};

// Get unreviewed emergency accesses
emergencyAccessSchema.statics.getUnreviewed = function() {
  return this.find({
    reviewedAt: { $exists: false },
    status: { $in: ['active', 'expired'] }
  })
  .populate('doctor', 'personalInfo professionalInfo email')
  .populate('patient', 'personalInfo email phoneNumber')
  .sort({ requestedAt: -1 });
};

// Get flagged emergency accesses
emergencyAccessSchema.statics.getFlagged = function() {
  return this.find({
    flaggedForReview: true,
    status: { $in: ['active', 'pending'] }
  })
  .populate('doctor', 'personalInfo professionalInfo email')
  .populate('patient', 'personalInfo email phoneNumber')
  .sort({ requestedAt: -1 });
};

// Pre-save middleware - Auto-flag suspicious requests
emergencyAccessSchema.pre('save', function(next) {
  if (this.isNew) {
    // Check if doctor has multiple emergency requests in short time
    // This could be implemented with additional logic
    
    // Flag if justification is too short
    if (this.justification && this.justification.length < 50) {
      this.flaggedForReview = true;
      this.flaggedReason = 'Insufficient justification';
    }
  }
  
  next();
});

const EmergencyAccess = mongoose.model('EmergencyAccess', emergencyAccessSchema);

export default EmergencyAccess;
