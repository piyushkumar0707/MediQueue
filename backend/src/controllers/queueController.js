import mongoose from 'mongoose';
import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

// Priority map: emergency=3 (highest), urgent=2, normal=1
const PRIORITY_VAL = { emergency: 3, urgent: 2, normal: 1 };
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import Notification from '../models/Notification.js';
import notificationService from '../services/notificationService.js';
import { callAI, redactPII, AI_FEATURES } from '../services/aiService.js';

// ─── Triage prompt (v1) ───────────────────────────────────────────────────────
const TRIAGE_SYSTEM_PROMPT = `You are a medical triage assistant. Based on the patient's symptoms, return ONLY valid JSON:
{
  "priority": "normal | urgent | emergency",
  "reason": "one sentence explanation",
  "confidence": "low | medium | high"
}

Emergency = potentially life-threatening (chest pain, difficulty breathing, severe bleeding, stroke symptoms).
Urgent = needs attention soon but not immediately life-threatening (high fever, persistent vomiting, moderate pain).
Normal = routine, can wait (mild headache, minor cold, prescription refill).
Never explain your reasoning outside the JSON object.`;

const TRIAGE_SCHEMA = { priority: 'string', reason: 'string', confidence: 'string' };
const VALID_PRIORITIES = ['normal', 'urgent', 'emergency'];
const VALID_CONFIDENCES = ['low', 'medium', 'high'];

// @desc    AI symptom triage — advisory only, never sets priority automatically
// @route   POST /api/queue/triage
// @access  Private (Patient)
export const triageSymptoms = asyncHandler(async (req, res) => {
  if (!AI_FEATURES.triage) {
    return res.status(503).json({ success: false, message: 'AI triage is currently disabled' });
  }

  const { symptoms } = req.body;
  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'symptoms field is required' });
  }
  if (symptoms.trim().length > 2000) {
    return res.status(400).json({ success: false, message: 'symptoms must be 2000 characters or less' });
  }

  const redacted = redactPII(symptoms.trim());
  const result = await callAI(TRIAGE_SYSTEM_PROMPT, redacted, TRIAGE_SCHEMA, {
    promptVersion: 'triage-v1',
    temperature: 0.1,
  });

  if (!result.success) {
    return res.status(200).json({
      success: false,
      message: 'AI suggestion unavailable. Please select priority manually.',
      fallback: true,
    });
  }

  // Sanitize AI output — only allow known enum values
  const priority   = VALID_PRIORITIES.includes(result.data.priority)   ? result.data.priority   : 'normal';
  const confidence = VALID_CONFIDENCES.includes(result.data.confidence) ? result.data.confidence : 'low';
  const reason     = typeof result.data.reason === 'string' ? result.data.reason.slice(0, 300) : '';

  return res.status(200).json({
    success:       true,
    priority,
    confidence,
    reason,
    promptVersion: result.promptVersion,
    latencyMs:     result.latencyMs,
  });
});

// @desc    Join queue (walk-in or from appointment)
// @route   POST /api/queue/join
// @access  Private (Patient)
export const joinQueue = asyncHandler(async (req, res) => {
  const { doctorId, reasonForVisit, priority, appointmentId, aiMetadata } = req.body;

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
    patient: req.user.userId,
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
    patient: req.user.userId,
    doctor: doctorId,
    appointment: appointmentId || null,
    queueNumber: queueCount + 1,
    reasonForVisit,
    priority: priority || 'normal',
    estimatedWaitTime: queueCount * 15, // 15 min per patient estimate
    // AI metadata — stored as-is; backend never reads it to determine priority
    ...(aiMetadata?.aiSuggestedPriority && {
      aiSuggestedPriority: VALID_PRIORITIES.includes(aiMetadata.aiSuggestedPriority) ? aiMetadata.aiSuggestedPriority : undefined,
      aiConfidence:        ['low', 'medium', 'high'].includes(aiMetadata.aiConfidence) ? aiMetadata.aiConfidence : undefined,
      aiReason:            typeof aiMetadata.aiReason === 'string' ? aiMetadata.aiReason.slice(0, 300) : undefined,
      aiOverridden:        typeof aiMetadata.aiOverridden === 'boolean' ? aiMetadata.aiOverridden : undefined,
      promptVersion:       typeof aiMetadata.promptVersion === 'string' ? aiMetadata.promptVersion : undefined,
    }),
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
    patient: req.user.userId,
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

  // Calculate current position dynamically
  const position = await queueEntry.calculatePosition();
  // Recalculate wait time based on current position (15 min per patient ahead)
  const freshEstimatedWait = Math.max(0, (position - 1) * 15);

  res.json({
    success: true,
    data: {
      ...queueEntry.toObject(),
      currentPosition: position,
      estimatedWaitTime: freshEstimatedWait,
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
    patient: req.user.userId
  })
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('appointment')
    .sort({ checkInTime: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Queue.countDocuments({ patient: req.user.userId });

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
    doctor: req.user.userId,
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
    .sort({ checkInTime: 1 });

  // Sort with correct priority order: emergency > urgent > normal
  queue.sort((a, b) => {
    const priDiff = (PRIORITY_VAL[b.priority] || 1) - (PRIORITY_VAL[a.priority] || 1);
    if (priDiff !== 0) return priDiff;
    return new Date(a.checkInTime) - new Date(b.checkInTime);
  });

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
    { doctor: req.user.userId, status: 'in-progress' },
    { status: 'completed', completedTime: new Date() }
  );

  // Get next patient with correct priority order: emergency > urgent > normal
  const [rawNext] = await Queue.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(req.user.userId), status: 'waiting' } },
    { $addFields: { _priorityVal: { $switch: { branches: [
      { case: { $eq: ['$priority', 'emergency'] }, then: 3 },
      { case: { $eq: ['$priority', 'urgent'] }, then: 2 },
      { case: { $eq: ['$priority', 'normal'] }, then: 1 }
    ], default: 1 } } } },
    { $sort: { _priorityVal: -1, checkInTime: 1 } },
    { $limit: 1 }
  ]);

  if (!rawNext) {
    return res.status(404).json({
      success: false,
      message: 'No patients waiting in queue'
    });
  }

  const nextPatient = await Queue.findById(rawNext._id)
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('appointment');

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

  // Create notification for patient
  const notification = await Notification.createNotification({
    recipient: nextPatient.patient._id,
    sender: req.user.userId,
    type: 'queue_update',
    title: '🔔 Your Turn!',
    message: `Please proceed to ${consultationRoom || 'the consultation room'}. The doctor is ready to see you now.`,
    priority: 'high',
    channels: {
      inApp: true,
      email: true,
      sms: false,
    },
    actionUrl: '/patient/queue',
  });

  // Send notification through all channels
  await notificationService.sendNotification(notification);

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
  if (queueEntry.doctor.toString() !== req.user.userId.toString()) {
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
  const isPatient = queueEntry.patient.toString() === req.user.userId.toString();
  const isDoctor = queueEntry.doctor.toString() === req.user.userId.toString();

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
        doctor: req.user.userId,
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

