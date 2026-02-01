import mongoose from 'mongoose';

const consentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required'],
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor reference is required'],
    index: true
  },
  // Consent can be for specific records or all records
  scope: {
    type: String,
    enum: ['all-records', 'specific-records', 'record-types'],
    default: 'all-records'
  },
  // If scope is specific-records, list the record IDs
  specificRecords: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  }],
  // If scope is record-types, list the types
  recordTypes: [{
    type: String,
    enum: [
      'lab-report',
      'prescription',
      'radiology',
      'consultation-notes',
      'discharge-summary',
      'medical-history',
      'insurance',
      'vaccination',
      'allergy-info',
      'other'
    ]
  }],
  // Permissions granted
  permissions: {
    canView: {
      type: Boolean,
      default: true
    },
    canDownload: {
      type: Boolean,
      default: true
    },
    canShare: {
      type: Boolean,
      default: false
    }
  },
  // Consent status
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired', 'pending'],
    default: 'active',
    index: true
  },
  // Expiry
  expiresAt: {
    type: Date,
    default: null // null means no expiry
  },
  // Reason for consent (optional)
  purpose: {
    type: String,
    trim: true,
    maxlength: [500, 'Purpose cannot exceed 500 characters']
  },
  // Consent given details
  consentGivenAt: {
    type: Date,
    default: Date.now
  },
  consentGivenMethod: {
    type: String,
    enum: ['manual', 'automatic', 'emergency-override'],
    default: 'manual'
  },
  // Revocation details
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revocationReason: String,
  // Access log
  accessLog: [{
    accessedAt: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['viewed', 'downloaded', 'shared']
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord'
    },
    ipAddress: String
  }],
  // Metadata
  metadata: {
    consentFormVersion: String,
    agreementText: String,
    electronicSignature: Boolean
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
consentSchema.index({ patient: 1, doctor: 1 });
consentSchema.index({ patient: 1, status: 1 });
consentSchema.index({ doctor: 1, status: 1 });
consentSchema.index({ expiresAt: 1 });

// Virtual to check if consent is still valid
consentSchema.virtual('isValid').get(function() {
  if (this.status !== 'active') {
    return false;
  }
  if (this.expiresAt && new Date(this.expiresAt) < new Date()) {
    return false;
  }
  return true;
});

// Method to check if consent covers a specific record
consentSchema.methods.coversRecord = function(recordId, recordType) {
  if (this.scope === 'all-records') {
    return true;
  }
  if (this.scope === 'specific-records') {
    return this.specificRecords.some(id => id.toString() === recordId.toString());
  }
  if (this.scope === 'record-types') {
    return this.recordTypes.includes(recordType);
  }
  return false;
};

// Method to log access
consentSchema.methods.logAccess = function(action, recordId, ipAddress) {
  this.accessLog.push({
    accessedAt: new Date(),
    action,
    recordId,
    ipAddress
  });
  return this.save();
};

// Method to revoke consent
consentSchema.methods.revoke = function(revokedBy, reason) {
  this.status = 'revoked';
  this.revokedAt = new Date();
  this.revokedBy = revokedBy;
  this.revocationReason = reason;
  return this.save();
};

// Static method to check consent for a doctor-patient-record combination
consentSchema.statics.hasConsent = async function(doctorId, patientId, recordId, recordType) {
  const consents = await this.find({
    patient: patientId,
    doctor: doctorId,
    status: 'active',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
  
  return consents.some(consent => consent.coversRecord(recordId, recordType));
};

// Auto-expire old consents (can be run as a cron job)
consentSchema.statics.expireOldConsents = async function() {
  const result = await this.updateMany(
    {
      status: 'active',
      expiresAt: { $lte: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  );
  return result;
};

const Consent = mongoose.model('Consent', consentSchema);

export default Consent;
