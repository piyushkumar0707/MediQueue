import { asyncHandler } from '../utils/asyncHandler.js';
import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';

/**
 * @desc    Get all emergency cases (queue + appointments)
 * @route   GET /api/admin/emergency
 * @access  Private (Admin)
 */
export const getEmergencyCases = asyncHandler(async (req, res) => {
  const { status, priority, assignedDoctor } = req.query;

  // Build queue query
  const queueQuery = { isEmergency: true };
  if (status && status !== 'all') queueQuery.status = status;
  if (priority && priority !== 'all') queueQuery.priority = priority;
  if (assignedDoctor) queueQuery.assignedDoctor = assignedDoctor;

  // Build appointment query
  const appointmentQuery = { isEmergency: true };
  if (status && status !== 'all') appointmentQuery.status = status;
  if (assignedDoctor) appointmentQuery.doctorId = assignedDoctor;

  // Fetch emergency queue entries
  const emergencyQueue = await Queue.find(queueQuery)
    .populate('patientId', 'email personalInfo phoneNumber')
    .populate('assignedDoctor', 'email personalInfo professionalInfo')
    .sort({ priority: -1, createdAt: 1 })
    .lean();

  // Fetch emergency appointments
  const emergencyAppointments = await Appointment.find(appointmentQuery)
    .populate('patientId', 'email personalInfo phoneNumber')
    .populate('doctorId', 'email personalInfo professionalInfo')
    .sort({ appointmentDate: 1 })
    .lean();

  // Combine and format
  const cases = [
    ...emergencyQueue.map(q => ({
      _id: q._id,
      type: 'queue',
      patient: {
        id: q.patientId?._id,
        name: `${q.patientId?.personalInfo?.firstName || ''} ${q.patientId?.personalInfo?.lastName || ''}`.trim(),
        email: q.patientId?.email,
        phone: q.patientId?.phoneNumber
      },
      doctor: q.assignedDoctor ? {
        id: q.assignedDoctor._id,
        name: `${q.assignedDoctor.personalInfo?.firstName || ''} ${q.assignedDoctor.personalInfo?.lastName || ''}`.trim(),
        specialization: q.assignedDoctor.professionalInfo?.specialization
      } : null,
      status: q.status,
      priority: q.priority,
      chiefComplaint: q.chiefComplaint,
      symptoms: q.symptoms,
      vitalSigns: q.vitalSigns,
      triageNotes: q.triageNotes,
      createdAt: q.createdAt,
      waitTime: Math.floor((Date.now() - new Date(q.createdAt).getTime()) / (1000 * 60)) // minutes
    })),
    ...emergencyAppointments.map(a => ({
      _id: a._id,
      type: 'appointment',
      patient: {
        id: a.patientId?._id,
        name: `${a.patientId?.personalInfo?.firstName || ''} ${a.patientId?.personalInfo?.lastName || ''}`.trim(),
        email: a.patientId?.email,
        phone: a.patientId?.phoneNumber
      },
      doctor: a.doctorId ? {
        id: a.doctorId._id,
        name: `${a.doctorId.personalInfo?.firstName || ''} ${a.doctorId.personalInfo?.lastName || ''}`.trim(),
        specialization: a.doctorId.professionalInfo?.specialization
      } : null,
      status: a.status,
      appointmentDate: a.appointmentDate,
      appointmentType: a.appointmentType,
      reason: a.reason,
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
      $match: { isEmergency: true }
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
      $match: { isEmergency: true }
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
    isEmergency: true,
    createdAt: { $gte: last24Hours }
  });

  // Average wait time for completed emergencies (last 7 days)
  const completedEmergencies = await Queue.find({
    isEmergency: true,
    status: 'completed',
    createdAt: { $gte: last7Days },
    actualEndTime: { $exists: true }
  });

  let avgWaitTime = 0;
  if (completedEmergencies.length > 0) {
    const totalWaitTime = completedEmergencies.reduce((sum, q) => {
      const wait = new Date(q.actualEndTime) - new Date(q.createdAt);
      return sum + wait;
    }, 0);
    avgWaitTime = Math.floor(totalWaitTime / completedEmergencies.length / (1000 * 60)); // minutes
  }

  // Priority distribution
  const priorityDistribution = await Queue.aggregate([
    {
      $match: { isEmergency: true, status: { $in: ['waiting', 'in-progress'] } }
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

  if (!priority || ![1, 2, 3, 4, 5].includes(priority)) {
    return res.status(400).json({
      success: false,
      message: 'Valid priority (1-5) is required'
    });
  }

  const queueEntry = await Queue.findById(id);

  if (!queueEntry) {
    return res.status(404).json({
      success: false,
      message: 'Emergency case not found'
    });
  }

  queueEntry.priority = priority;
  await queueEntry.save();

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

  queueEntry.assignedDoctor = doctorId;
  if (queueEntry.status === 'waiting') {
    queueEntry.status = 'in-progress';
    queueEntry.actualStartTime = new Date();
  }
  await queueEntry.save();

  await queueEntry.populate('assignedDoctor', 'email personalInfo professionalInfo');

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
    queueEntry.actualStartTime = new Date();
  } else if (status === 'completed' && !queueEntry.actualEndTime) {
    queueEntry.actualEndTime = new Date();
  }

  await queueEntry.save();

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
        assignedDoctor: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$assignedDoctor',
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
    name: `${doc.personalInfo?.firstName || ''} ${doc.personalInfo?.lastName || ''}`.trim(),
    email: doc.email,
    specialization: doc.professionalInfo?.specialization,
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
