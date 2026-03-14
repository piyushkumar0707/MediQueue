import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient reference is required']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor reference is required']
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  queueNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'waiting'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  calledTime: {
    type: Date
  },
  completedTime: {
    type: Date
  },
  estimatedWaitTime: {
    type: Number, // in minutes
    default: 0
  },
  reasonForVisit: {
    type: String,
    required: [true, 'Reason for visit is required']
  },
  notes: {
    type: String
  },
  consultationRoom: {
    type: String
  },
  // AI triage metadata — all optional, only set when AI was used
  aiSuggestedPriority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency']
  },
  aiConfidence: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  aiReason: {
    type: String
  },
  aiOverridden: {
    type: Boolean
  },
  promptVersion: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
queueSchema.index({ doctor: 1, status: 1, checkInTime: 1 });
queueSchema.index({ patient: 1, checkInTime: -1 });

// Virtual for wait duration
queueSchema.virtual('waitDuration').get(function() {
  if (this.status === 'waiting' && this.checkInTime) {
    return Math.floor((Date.now() - this.checkInTime.getTime()) / 60000); // minutes
  }
  if (this.status === 'completed' && this.completedTime && this.checkInTime) {
    return Math.floor((this.completedTime.getTime() - this.checkInTime.getTime()) / 60000);
  }
  return 0;
});

// Priority order: emergency (highest) > urgent > normal
const PRIORITY_ORDER = ['normal', 'urgent', 'emergency'];

// Method to calculate position in queue
queueSchema.methods.calculatePosition = async function() {
  const Queue = this.constructor;
  const myPriorityIdx = PRIORITY_ORDER.indexOf(this.priority);
  // Patients with higher semantic priority (further right in PRIORITY_ORDER)
  const higherPriorities = PRIORITY_ORDER.slice(myPriorityIdx + 1);

  const orConditions = [
    { priority: this.priority, checkInTime: { $lt: this.checkInTime } } // Same priority, earlier check-in
  ];
  if (higherPriorities.length > 0) {
    orConditions.unshift({ priority: { $in: higherPriorities } }); // Any higher-priority patient
  }

  const position = await Queue.countDocuments({
    doctor: this.doctor,
    status: 'waiting',
    $or: orConditions
  });
  return position + 1;
};

const Queue = mongoose.model('Queue', queueSchema);

export default Queue;
