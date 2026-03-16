import mongoose from 'mongoose';

// Atomic counter helper — avoids race condition in prescriptionNumber generation
const getNextPrescriptionSequence = async (prefix) => {
  const result = await mongoose.connection.collection('counters').findOneAndUpdate(
    { _id: `prescription_${prefix}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result.seq;
};

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  instructions: {
    type: String,
    trim: true,
    default: ''
  },
  timing: {
    type: String,
    enum: ['Before Food', 'After Food', 'With Food', 'Empty Stomach', 'Anytime'],
    default: 'After Food'
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
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
  queueEntry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Queue'
  },
  prescriptionNumber: {
    type: String,
    unique: true
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
    trim: true
  },
  medicines: {
    type: [medicineSchema],
    validate: {
      validator: function(medicines) {
        return medicines && medicines.length > 0;
      },
      message: 'At least one medicine is required'
    }
  },
  tests: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  },
  followUpInstructions: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  validUntil: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });
prescriptionSchema.index({ prescriptionNumber: 1 });
prescriptionSchema.index({ appointment: 1 });

// Pre-save hook to generate prescription number atomically
prescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `RX-${year}${month}`;

    const seq = await getNextPrescriptionSequence(prefix);
    this.prescriptionNumber = `${prefix}-${String(seq).padStart(4, '0')}`;
  }
  
  // Set default valid until date (30 days from creation)
  if (this.isNew && !this.validUntil) {
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    this.validUntil = validDate;
  }
  
  next();
});

// Method to check if prescription is expired
prescriptionSchema.methods.isExpired = function() {
  return this.validUntil && new Date() > this.validUntil;
};

// Method to check if prescription is valid
prescriptionSchema.methods.isValid = function() {
  return this.status === 'active' && !this.isExpired();
};

const Prescription = mongoose.model('Prescription', prescriptionSchema);

export default Prescription;
