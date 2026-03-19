import { asyncHandler } from '../utils/asyncHandler.js';
import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

const PRIORITY_TO_SCORE = {
  normal: 1,
  urgent: 3,
  emergency: 5
};

const SCORE_TO_PRIORITY = {
  '1': 'normal',
  '2': 'normal',
  '3': 'urgent',
  '4': 'emergency',
  '5': 'emergency'
};

const normalizePriorityInput = (priority) => {
  if (!priority || priority === 'all') return null;
  const normalized = String(priority).toLowerCase();
  if (PRIORITY_TO_SCORE[normalized]) return normalized;
  return SCORE_TO_PRIORITY[normalized] || null;
};

const getUserName = (user) => `${user?.personalInfo?.firstName || ''} ${user?.personalInfo?.lastName || ''}`.trim();

/**
 * @desc    Get all emergency cases (queue + appointments)
 * @route   GET /api/admin/emergency
 * @access  Private (Admin)
 */
export const getEmergencyCases = asyncHandler(async (req, res) => {
  const { status, priority, assignedDoctor } = req.query;
  const normalizedPriority = normalizePriorityInput(priority);

  // Build queue query from actual schema fields
  const queueQuery = { priority: 'emergency' };
  if (status && status !== 'all') queueQuery.status = status;
  if (normalizedPriority) queueQuery.priority = normalizedPriority;
  if (assignedDoctor) queueQuery.doctor = assignedDoctor;

  // Build appointment query from actual schema fields
  const appointmentQuery = { type: 'emergency' };
  if (status && status !== 'all') appointmentQuery.status = status;
  if (assignedDoctor) appointmentQuery.doctor = assignedDoctor;

  // Fetch emergency queue entries
  const emergencyQueue = await Queue.find(queueQuery)
    .populate('patient', 'email personalInfo phoneNumber')
    .populate('doctor', 'email personalInfo professionalInfo')
    .sort({ createdAt: 1 })
    .lean();

  // Fetch emergency appointments
  const emergencyAppointments = await Appointment.find(appointmentQuery)
    .populate('patient', 'email personalInfo phoneNumber')
    .populate('doctor', 'email personalInfo professionalInfo')
    .sort({ appointmentDate: 1 })
    .lean();

  // Combine and format
  const cases = [
    ...emergencyQueue.map(q => ({
      _id: q._id,
      type: 'queue',
      patient: {
        id: q.patient?._id,
        name: getUserName(q.patient),
        email: q.patient?.email,
        phone: q.patient?.phoneNumber
      },
      doctor: q.doctor ? {
        id: q.doctor._id,
        name: getUserName(q.doctor),
        specialization: q.doctor.professionalInfo?.specialty || q.doctor.professionalInfo?.specialization,
        specialty: q.doctor.professionalInfo?.specialty || q.doctor.professionalInfo?.specialization
      } : null,
      status: q.status,
      priority: PRIORITY_TO_SCORE[q.priority] || 1,
      priorityCode: q.priority,
      chiefComplaint: q.reasonForVisit,
      symptoms: q.symptoms,
      createdAt: q.createdAt,
      waitTime: Math.floor((Date.now() - new Date(q.checkInTime || q.createdAt).getTime()) / (1000 * 60))
    })),
    ...emergencyAppointments.map(a => ({
      _id: a._id,
      type: 'appointment',
      patient: {
        id: a.patient?._id,
        name: getUserName(a.patient),
        email: a.patient?.email,
        phone: a.patient?.phoneNumber
      },
      doctor: a.doctor ? {
        id: a.doctor._id,
        name: getUserName(a.doctor),
        specialization: a.doctor.professionalInfo?.specialty || a.doctor.professionalInfo?.specialization,
        specialty: a.doctor.professionalInfo?.specialty || a.doctor.professionalInfo?.specialization
      } : null,
      status: a.status,
      appointmentDate: a.appointmentDate,
      appointmentType: a.type,
      reason: a.reasonForVisit,
      notes: a.notes,
      createdAt: a.createdAt
    }))
  ];

  res.json({
    success: true,
    data: cases,
    counts: {
      total: cases.length,
      queue: emergencyQueue.length,
      appointments: emergencyAppointments.length
    }
  });
});

/**
 * @desc    Get emergency statistics
 * @route   GET /api/admin/emergency/stats
 * @access  Private (Admin)
 */
export const getEmergencyStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
  const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Emergency queue stats
  const queueStats = await Queue.aggregate([
    {
      $match: { priority: 'emergency' }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Emergency appointments stats
  const appointmentStats = await Appointment.aggregate([
    {
      $match: { type: 'emergency' }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Recent emergencies (last 24 hours)
  const recentEmergencies = await Queue.countDocuments({
    priority: 'emergency',
    createdAt: { $gte: last24Hours }
  });

  // Average wait time for completed emergencies (last 7 days)
  const completedEmergencies = await Queue.find({
    priority: 'emergency',
    status: 'completed',
    createdAt: { $gte: last7Days },
    completedTime: { $exists: true }
  });

  let avgWaitTime = 0;
  if (completedEmergencies.length > 0) {
    const totalWaitTime = completedEmergencies.reduce((sum, q) => {
      const wait = new Date(q.completedTime) - new Date(q.checkInTime || q.createdAt);
      return sum + wait;
    }, 0);
    avgWaitTime = Math.floor(totalWaitTime / completedEmergencies.length / (1000 * 60)); // minutes
  }

  // Priority distribution
  const priorityDistribution = await Queue.aggregate([
    {
      $match: { priority: 'emergency', status: { $in: ['waiting', 'in-progress'] } }
    },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      queueStats,
      appointmentStats,
      recentEmergencies,
      avgWaitTime,
      priorityDistribution
    }
  });
});

/**
 * @desc    Update emergency priority
 * @route   PATCH /api/admin/emergency/:id/priority
 * @access  Private (Admin)
 */
export const updateEmergencyPriority = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;
  const normalizedPriority = normalizePriorityInput(priority);

  if (!normalizedPriority) {
    return res.status(400).json({
      success: false,
      message: 'Valid priority is required (normal, urgent, emergency or 1-5)'
    });
  }

  const queueEntry = await Queue.findById(id);

  if (!queueEntry) {
    return res.status(404).json({
      success: false,
      message: 'Emergency case not found'
    });
  }

  queueEntry.priority = normalizedPriority;
  await queueEntry.save({ validateModifiedOnly: true });

  res.json({
    success: true,
    message: 'Priority updated successfully',
    data: queueEntry
  });
});

/**
 * @desc    Assign doctor to emergency case
 * @route   PATCH /api/admin/emergency/:id/assign
 * @access  Private (Admin)
 */
export const assignDoctorToEmergency = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { doctorId } = req.body;

  if (!doctorId) {
    return res.status(400).json({
      success: false,
      message: 'Doctor ID is required'
    });
  }

  // Verify doctor exists and is active
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found or inactive'
    });
  }

  const queueEntry = await Queue.findById(id);

  if (!queueEntry) {
    return res.status(404).json({
      success: false,
      message: 'Emergency case not found'
    });
  }

  queueEntry.doctor = doctorId;
  if (queueEntry.status === 'waiting') {
    queueEntry.status = 'in-progress';
    queueEntry.calledTime = new Date();
  }
  await queueEntry.save({ validateModifiedOnly: true });

  await queueEntry.populate('doctor', 'email personalInfo professionalInfo');

  res.json({
    success: true,
    message: 'Doctor assigned successfully',
    data: queueEntry
  });
});

/**
 * @desc    Update emergency case status
 * @route   PATCH /api/admin/emergency/:id/status
 * @access  Private (Admin)
 */
export const updateEmergencyStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['waiting', 'in-progress', 'completed', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required (waiting, in-progress, completed, cancelled)'
    });
  }

  const queueEntry = await Queue.findById(id);

  if (!queueEntry) {
    return res.status(404).json({
      success: false,
      message: 'Emergency case not found'
    });
  }

  const oldStatus = queueEntry.status;
  queueEntry.status = status;

  // Update timestamps based on status
  if (status === 'in-progress' && oldStatus === 'waiting') {
    queueEntry.calledTime = new Date();
  } else if (status === 'completed' && !queueEntry.completedTime) {
    queueEntry.completedTime = new Date();
  }

  await queueEntry.save({ validateModifiedOnly: true });

  res.json({
    success: true,
    message: 'Status updated successfully',
    data: queueEntry
  });
});

/**
 * @desc    Get available doctors for emergency assignment
 * @route   GET /api/admin/emergency/available-doctors
 * @access  Private (Admin)
 */
export const getAvailableDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({
    role: 'doctor',
    isActive: true
  })
    .select('email personalInfo professionalInfo')
    .lean();

  // Get current assignments count for each doctor
  const doctorAssignments = await Queue.aggregate([
    {
      $match: {
        status: { $in: ['waiting', 'in-progress'] },
        doctor: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$doctor',
        activeCount: { $sum: 1 }
      }
    }
  ]);

  const assignmentMap = {};
  doctorAssignments.forEach(a => {
    assignmentMap[a._id.toString()] = a.activeCount;
  });

  const doctorsWithLoad = doctors.map(doc => ({
    _id: doc._id,
    name: getUserName(doc),
    email: doc.email,
    specialization: doc.professionalInfo?.specialty || doc.professionalInfo?.specialization,
    specialty: doc.professionalInfo?.specialty || doc.professionalInfo?.specialization,
    experience: doc.professionalInfo?.experience,
    activePatients: assignmentMap[doc._id.toString()] || 0
  }));

  // Sort by active patients (fewer first)
  doctorsWithLoad.sort((a, b) => a.activePatients - b.activePatients);

  res.json({
    success: true,
    data: doctorsWithLoad
  });
});
