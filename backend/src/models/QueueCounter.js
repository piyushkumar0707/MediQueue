import mongoose from 'mongoose';

const queueCounterSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true
  },
  counter: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound unique index to ensure one counter per doctor per day
queueCounterSchema.index({ doctorId: 1, date: 1 }, { unique: true });

/**
 * Get next queue number for a doctor on a given date (atomic operation)
 * @param {ObjectId} doctorId - Doctor's ID
 * @param {Date} date - Date for queue (defaults to today)
 * @returns {Number} Next queue number
 */
queueCounterSchema.statics.getNextQueueNumber = async function(doctorId, date = new Date()) {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  const result = await this.findOneAndUpdate(
    { doctorId, date: dateStr },
    { $inc: { counter: 1 } },
    { 
      new: true, 
      upsert: true,
      setDefaultsOnInsert: true 
    }
  );
  
  return result.counter;
};

const QueueCounter = mongoose.model('QueueCounter', queueCounterSchema);

export default QueueCounter;
