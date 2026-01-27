import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required'],
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader reference is required']
  },
  recordType: {
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
    ],
    required: [true, 'Record type is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  recordDate: {
    type: Date,
    required: [true, 'Record date is required'],
    default: Date.now
  },
  files: [{
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    hospital: String,
    doctorName: String,
    department: String,
    diagnosis: String,
    tags: [String]
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  encryptionKey: {
    type: String,
    select: false // Don't return by default
  },
  visibility: {
    type: String,
    enum: ['private', 'shared-with-doctors', 'public-to-facility'],
    default: 'private'
  },
  sharedWith: [{
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    canDownload: {
      type: Boolean,
      default: true
    }
  }],
  accessLog: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    action: {
      type: String,
      enum: ['create', 'view', 'download', 'share', 'update', 'delete', 'upload']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ patient: 1, recordType: 1 });
medicalRecordSchema.index({ patient: 1, recordDate: -1 });
medicalRecordSchema.index({ 'sharedWith.doctor': 1 });
medicalRecordSchema.index({ status: 1 });

// Method to log access
medicalRecordSchema.methods.logAccess = function(userId, action, ipAddress) {
  this.accessLog.push({
    user: userId,
    action,
    timestamp: new Date(),
    ipAddress
  });
  return this.save();
};

// Method to check if user has access
medicalRecordSchema.methods.canUserAccess = function(userId, userRole) {
  // Patient always has access to their own records
  if (this.patient.toString() === userId) {
    return true;
  }
  
  // Admin has access to all records
  if (userRole === 'admin') {
    return true;
  }
  
  // Check if doctor has explicit access
  if (userRole === 'doctor') {
    // Check if shared with this doctor
    const sharedAccess = this.sharedWith.find(share => {
      const hasAccess = share.doctor.toString() === userId;
      const notExpired = !share.expiresAt || new Date(share.expiresAt) > new Date();
      return hasAccess && notExpired;
    });
    
    return !!sharedAccess;
  }
  
  return false;
};

// Method to share record with doctor
medicalRecordSchema.methods.shareWith = function(doctorId, expiresAt = null, canDownload = true) {
  // Check if already shared
  const existingShare = this.sharedWith.find(
    share => share.doctor.toString() === doctorId
  );
  
  if (existingShare) {
    // Update existing share
    existingShare.expiresAt = expiresAt;
    existingShare.canDownload = canDownload;
    existingShare.sharedAt = new Date();
  } else {
    // Add new share
    this.sharedWith.push({
      doctor: doctorId,
      sharedAt: new Date(),
      expiresAt,
      canDownload
    });
  }
  
  return this.save();
};

// Method to revoke access
medicalRecordSchema.methods.revokeAccess = function(doctorId) {
  this.sharedWith = this.sharedWith.filter(
    share => share.doctor.toString() !== doctorId
  );
  return this.save();
};

// Static method to get records shared with doctor
medicalRecordSchema.statics.getSharedWithDoctor = function(doctorId) {
  return this.find({
    'sharedWith.doctor': doctorId,
    status: 'active',
    $or: [
      { 'sharedWith.expiresAt': null },
      { 'sharedWith.expiresAt': { $gt: new Date() } }
    ]
  })
  .populate('patient', 'personalInfo email phoneNumber')
  .populate('uploadedBy', 'personalInfo')
  .sort({ recordDate: -1 });
};

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

export default MedicalRecord;
