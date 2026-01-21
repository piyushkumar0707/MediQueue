import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

// @desc    Join queue (walk-in or from appointment)
// @route   POST /api/queue/join
// @access  Private (Patient)
export const joinQueue = asyncHandler(async (req, res) => {
  const { doctorId, reasonForVisit, priority, appointmentId } = req.body;

  // Validate doctor exists
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Check if patient already in queue for this doctor
  const existingQueue = await Queue.findOne({
    patient: req.user._id,
    doctor: doctorId,
    status: { $in: ['waiting', 'in-progress'] }
  });

  if (existingQueue) {
    return res.status(400).json({
      success: false,
      message: 'You are already in queue for this doctor'
    });
  }

  // Get current queue count for queue number
  const queueCount = await Queue.countDocuments({
    doctor: doctorId,
    status: { $in: ['waiting', 'in-progress'] }
  });

  // Create queue entry
  const queueEntry = await Queue.create({
    patient: req.user._id,
    doctor: doctorId,
    appointment: appointmentId || null,
    queueNumber: queueCount + 1,
    reasonForVisit,
    priority: priority || 'normal',
    estimatedWaitTime: queueCount * 15 // 15 min per patient estimate
  });

  // Update appointment if exists
  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'checked-in',
      queueEntry: queueEntry._id
    });
  }

  // Populate the entry
  await queueEntry.populate([
    { path: 'patient', select: 'personalInfo phoneNumber email' },
    { path: 'doctor', select: 'personalInfo professionalInfo' }
  ]);

  logger.info(`Patient ${req.user.email} joined queue for doctor ${doctor.email}`);

  res.status(201).json({
    success: true,
    message: 'Successfully joined the queue',
    data: queueEntry
  });
});

// @desc    Get patient's current queue status
// @route   GET /api/queue/my-status
// @access  Private (Patient)
export const getMyQueueStatus = asyncHandler(async (req, res) => {
  const queueEntry = await Queue.findOne({
    patient: req.user._id,
    status: { $in: ['waiting', 'in-progress'] }
  }).populate([
    { path: 'doctor', select: 'personalInfo professionalInfo' },
    { path: 'appointment' }
  ]);

  if (!queueEntry) {
    return res.status(404).json({
      success: false,
      message: 'You are not currently in any queue'
    });
  }

  // Calculate current position
  const position = await queueEntry.calculatePosition();

  res.json({
    success: true,
    data: {
      ...queueEntry.toObject(),
      currentPosition: position,
      waitDuration: queueEntry.waitDuration
    }
  });
});

// @desc    Get patient's queue history
// @route   GET /api/queue/my-history
// @access  Private (Patient)
export const getMyQueueHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const queueHistory = await Queue.find({
    patient: req.user._id
  })
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('appointment')
    .sort({ checkInTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Queue.countDocuments({ patient: req.user._id });

  res.json({
    success: true,
    data: queueHistory,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

// @desc    Get doctor's queue
// @route   GET /api/queue/doctor-queue
// @access  Private (Doctor)
export const getDoctorQueue = asyncHandler(async (req, res) => {
  const { status = 'waiting', date } = req.query;

  const query = {
    doctor: req.user._id,
    status: status === 'all' ? { $in: ['waiting', 'in-progress', 'completed'] } : status
  };

  // Filter by date if provided
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.checkInTime = { $gte: startDate, $lte: endDate };
  }

  const queue = await Queue.find(query)
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('appointment')
    .sort({ priority: -1, checkInTime: 1 });

  // Calculate positions for waiting patients
  const queueWithPositions = await Promise.all(
    queue.map(async (entry) => {
      const position = entry.status === 'waiting' ? await entry.calculatePosition() : null;
      return {
        ...entry.toObject(),
        position,
        waitDuration: entry.waitDuration
      };
    })
  );

  res.json({
    success: true,
    data: queueWithPositions,
    summary: {
      waiting: queue.filter(q => q.status === 'waiting').length,
      inProgress: queue.filter(q => q.status === 'in-progress').length,
      completed: queue.filter(q => q.status === 'completed').length
    }
  });
});

// @desc    Call next patient in queue
// @route   POST /api/queue/call-next
// @access  Private (Doctor)
export const callNextPatient = asyncHandler(async (req, res) => {
  const { consultationRoom } = req.body;

  // Complete any in-progress consultation
  await Queue.updateMany(
    { doctor: req.user._id, status: 'in-progress' },
    { status: 'completed', completedTime: new Date() }
  );

  // Get next patient (priority: emergency > urgent > normal, then by check-in time)
  const nextPatient = await Queue.findOne({
    doctor: req.user._id,
    status: 'waiting'
  })
    .sort({ priority: -1, checkInTime: 1 })
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('appointment');

  if (!nextPatient) {
    return res.status(404).json({
      success: false,
      message: 'No patients waiting in queue'
    });
  }

  // Update status
  nextPatient.status = 'in-progress';
  nextPatient.calledTime = new Date();
  if (consultationRoom) {
    nextPatient.consultationRoom = consultationRoom;
  }
  await nextPatient.save();

  // Update appointment if exists
  if (nextPatient.appointment) {
    await Appointment.findByIdAndUpdate(nextPatient.appointment._id, {
      status: 'in-progress'
    });
  }

  logger.info(`Doctor ${req.user.email} called patient ${nextPatient.patient.email}`);

  res.json({
    success: true,
    message: 'Patient called successfully',
    data: nextPatient
  });
});

// @desc    Update queue entry status
// @route   PATCH /api/queue/:id/status
// @access  Private (Doctor)
export const updateQueueStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const queueEntry = await Queue.findById(req.params.id);

  if (!queueEntry) {
    return res.status(404).json({
      success: false,
      message: 'Queue entry not found'
    });
  }

  // Verify doctor owns this queue entry
  if (queueEntry.doctor.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this queue entry'
    });
  }

  queueEntry.status = status;
  if (notes) queueEntry.notes = notes;
  if (status === 'completed') queueEntry.completedTime = new Date();

  await queueEntry.save();

  // Update appointment if exists
  if (queueEntry.appointment) {
    await Appointment.findByIdAndUpdate(queueEntry.appointment, { status });
  }

  res.json({
    success: true,
    message: 'Queue status updated',
    data: queueEntry
  });
});

// @desc    Cancel queue entry
// @route   DELETE /api/queue/:id
// @access  Private (Patient/Doctor)
export const cancelQueueEntry = asyncHandler(async (req, res) => {
  const queueEntry = await Queue.findById(req.params.id);

  if (!queueEntry) {
    return res.status(404).json({
      success: false,
      message: 'Queue entry not found'
    });
  }

  // Check authorization
  const isPatient = queueEntry.patient.toString() === req.user._id.toString();
  const isDoctor = queueEntry.doctor.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this queue entry'
    });
  }

  queueEntry.status = 'cancelled';
  await queueEntry.save();

  // Update appointment if exists
  if (queueEntry.appointment) {
    await Appointment.findByIdAndUpdate(queueEntry.appointment, {
      status: 'cancelled'
    });
  }

  logger.info(`Queue entry ${queueEntry._id} cancelled by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Queue entry cancelled successfully'
  });
});

// @desc    Get queue statistics
// @route   GET /api/queue/stats
// @access  Private (Doctor)
export const getQueueStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await Queue.aggregate([
    {
      $match: {
        doctor: req.user._id,
        checkInTime: { $gte: today }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgWaitTime: {
          $avg: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              {
                $divide: [
                  { $subtract: ['$completedTime', '$checkInTime'] },
                  60000 // Convert to minutes
                ]
              },
              0
            ]
          }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: stats
  });
});
