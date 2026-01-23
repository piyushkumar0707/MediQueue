import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // Authentication
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  countryCode: {
    type: String,
    default: '+91',
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  
  // Role & Permissions
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: [true, 'User role is required'],
    default: 'patient'
  },
  permissions: {
    type: [String],
    default: []
  },
  
  // Personal Information
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: ''
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    profilePicture: {
      type: String,
      default: ''
    }
  },
  
  // Patient-specific fields
  medicalInfo: {
    allergies: [String],
    chronicConditions: [String],
    emergencyContact: {
      name: String,
      relation: String,
      phoneNumber: String
    }
  },
  
  // Doctor-specific fields
  professionalInfo: {
    licenseNumber: {
      type: String,
      sparse: true,
      unique: true
    },
    specialty: String,
    qualifications: [String],
    experience: Number, // years
    consultationFee: {
      type: Number,
      default: 0
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    },
    availability: [{
      day: {
        type: Number, // 0 = Sunday, 1 = Monday, etc.
        min: 0,
        max: 6
      },
      startTime: String, // "09:00"
      endTime: String // "17:00"
    }],
    slotDuration: {
      type: Number,
      default: 15 // minutes
    },
    maxPatientsPerDay: {
      type: Number,
      default: 30
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    bio: String,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  
  // MFA (Multi-Factor Authentication)
  mfaSecret: {
    type: String,
    select: false
  },
  mfaEnabled: {
    type: Boolean,
    default: false // Will be mandatory after implementation
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Security
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Tokens
  refreshTokens: [{
    token: String,
    deviceInfo: String,
    ipAddress: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  
  // Notification Preferences
  notificationPreferences: {
    appointments: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true }
    },
    queue: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: false }
    },
    consent: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true }
    },
    emergency: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true }
    },
    prescriptions: {
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      email: { type: Boolean, default: true }
    },
    quietHours: {
      enabled: { type: Boolean, default: false },
      start: String, // "22:00"
      end: String // "08:00"
    }
  },
  
  // Timestamps
  lastLoginAt: Date,
  lastActiveAt: Date
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'professionalInfo.licenseNumber': 1 }, { sparse: true });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set passwordChangedAt
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure JWT is created after
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    throw new Error('User password not found');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // If lock has expired, restart attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Increment attempts
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 10 attempts for 1 hour
  const maxAttempts = 10;
  const lockTime = 60 * 60 * 1000; // 1 hour
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Method to add refresh token
userSchema.methods.addRefreshToken = async function(token, deviceInfo, ipAddress) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  this.refreshTokens.push({
    token,
    deviceInfo,
    ipAddress,
    expiresAt
  });
  
  // Keep only last 3 tokens (max 3 concurrent sessions)
  if (this.refreshTokens.length > 3) {
    this.refreshTokens = this.refreshTokens.slice(-3);
  }
  
  await this.save();
};

// Method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  await this.save();
};

// Method to remove all refresh tokens (logout from all devices)
userSchema.methods.removeAllRefreshTokens = async function() {
  this.refreshTokens = [];
  await this.save();
};

// Static method to find user by phone or email
userSchema.statics.findByPhoneOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phoneNumber: identifier }
    ]
  }).select('+password +mfaSecret');
};

const User = mongoose.model('User', userSchema);

export default User;
