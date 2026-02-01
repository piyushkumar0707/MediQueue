import EmergencyAccess from '../models/EmergencyAccess.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Request emergency access to patient records
// @route   POST /api/emergency-access/request
// @access  Private (Doctor)
export const requestEmergencyAccess = asyncHandler(async (req, res) => {
  const {
    patientId,
    emergencyType,
    justification,
    location,
    facilityName
  } = req.body;

  // Validate patient exists
  const patient = await User.findOne({ _id: patientId, role: 'patient' });
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Check if active emergency access already exists
  const existingAccess = await EmergencyAccess.getActiveAccess(req.user.userId, patientId);
  if (existingAccess) {
    return res.status(400).json({
      success: false,
      message: 'Active emergency access already exists for this patient',
      data: existingAccess
    });
  }

  // Create emergency access
  const emergencyAccess = await EmergencyAccess.create({
    doctor: req.user.userId,
    patient: patientId,
    emergencyType,
    justification,
    location: location || '',
    facilityName: facilityName || '',
    requestIpAddress: req.ip,
    requestUserAgent: req.headers['user-agent'],
    status: 'active' // Auto-approved but requires admin review
  });

  await emergencyAccess.populate([
    { path: 'doctor', select: 'personalInfo professionalInfo email' },
    { path: 'patient', select: 'personalInfo email phoneNumber' }
  ]);

  // TODO: Send notification to patient
  // TODO: Send notification to admin for review

  res.status(201).json({
    success: true,
    message: 'Emergency access granted. Admin will review this request.',
    data: emergencyAccess
  });
});

// @desc    Get my emergency access requests (Doctor)
// @route   GET /api/emergency-access/my-requests
// @access  Private (Doctor)
export const getMyEmergencyRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { doctor: req.user.userId };
  
  if (status && status !== 'all') {
    query.status = status;
  }

  const emergencyAccesses = await EmergencyAccess.find(query)
    .populate('patient', 'personalInfo email phoneNumber')
    .populate('reviewedBy', 'personalInfo')
    .sort({ requestedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await EmergencyAccess.countDocuments(query);

  res.json({
    success: true,
    data: emergencyAccesses,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

// @desc    Get emergency accesses for admin review
// @route   GET /api/emergency-access/for-review
// @access  Private (Admin)
export const getEmergencyAccessForReview = asyncHandler(async (req, res) => {
  const { filter = 'all', page = 1, limit = 10 } = req.query;

  let query = {};

  if (filter === 'unreviewed') {
    query.reviewedAt = { $exists: false };
    query.status = { $in: ['active', 'expired'] };
  } else if (filter === 'flagged') {
    query.flaggedForReview = true;
    query.status = { $in: ['active', 'pending'] };
  } else if (filter === 'active') {
    query.status = 'active';
    query.expiresAt = { $gt: new Date() };
  }

  const emergencyAccesses = await EmergencyAccess.find(query)
    .populate('doctor', 'personalInfo professionalInfo email')
    .populate('patient', 'personalInfo email phoneNumber')
    .populate('reviewedBy', 'personalInfo')
    .sort({ requestedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await EmergencyAccess.countDocuments(query);

  // Get counts for different filters
  const [unreviewedCount, flaggedCount, activeCount] = await Promise.all([
    EmergencyAccess.countDocuments({
      reviewedAt: { $exists: false },
      status: { $in: ['active', 'expired'] }
    }),
    EmergencyAccess.countDocuments({
      flaggedForReview: true,
      status: { $in: ['active', 'pending'] }
    }),
    EmergencyAccess.countDocuments({
      status: 'active',
      expiresAt: { $gt: new Date() }
    })
  ]);

  res.json({
    success: true,
    data: emergencyAccesses,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    },
    counts: {
      unreviewed: unreviewedCount,
      flagged: flaggedCount,
      active: activeCount
    }
  });
});

// @desc    Review emergency access (Admin)
// @route   PATCH /api/emergency-access/:id/review
// @access  Private (Admin)
export const reviewEmergencyAccess = asyncHandler(async (req, res) => {
  const { decision, notes } = req.body;

  if (!['approved', 'flagged', 'revoked', 'legitimate'].includes(decision)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid review decision'
    });
  }

  const emergencyAccess = await EmergencyAccess.findById(req.params.id);

  if (!emergencyAccess) {
    return res.status(404).json({
      success: false,
      message: 'Emergency access not found'
    });
  }

  await emergencyAccess.markReviewed(req.user.userId, decision, notes);

  await emergencyAccess.populate([
    { path: 'doctor', select: 'personalInfo professionalInfo' },
    { path: 'patient', select: 'personalInfo' },
    { path: 'reviewedBy', select: 'personalInfo' }
  ]);

  res.json({
    success: true,
    message: 'Emergency access reviewed successfully',
    data: emergencyAccess
  });
});

// @desc    Revoke emergency access
// @route   DELETE /api/emergency-access/:id
// @access  Private (Admin/Doctor who requested)
export const revokeEmergencyAccess = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const emergencyAccess = await EmergencyAccess.findById(req.params.id);

  if (!emergencyAccess) {
    return res.status(404).json({
      success: false,
      message: 'Emergency access not found'
    });
  }

  // Check if user has permission to revoke
  const isAdmin = req.user.role === 'admin';
  const isRequestingDoctor = emergencyAccess.doctor.toString() === req.user.userId;

  if (!isAdmin && !isRequestingDoctor) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to revoke this emergency access'
    });
  }

  if (emergencyAccess.status === 'revoked') {
    return res.status(400).json({
      success: false,
      message: 'Emergency access is already revoked'
    });
  }

  await emergencyAccess.revoke(req.user.userId, reason || 'Revoked by ' + req.user.role);

  res.json({
    success: true,
    message: 'Emergency access revoked successfully',
    data: emergencyAccess
  });
});

// @desc    Get emergency access statistics (Admin)
// @route   GET /api/emergency-access/stats
// @access  Private (Admin)
export const getEmergencyAccessStats = asyncHandler(async (req, res) => {
  const [
    totalRequests,
    activeAccesses,
    expiredAccesses,
    revokedAccesses,
    unreviewedCount,
    flaggedCount,
    recentRequests
  ] = await Promise.all([
    EmergencyAccess.countDocuments(),
    EmergencyAccess.countDocuments({ status: 'active', expiresAt: { $gt: new Date() } }),
    EmergencyAccess.countDocuments({ status: 'expired' }),
    EmergencyAccess.countDocuments({ status: 'revoked' }),
    EmergencyAccess.countDocuments({
      reviewedAt: { $exists: false },
      status: { $in: ['active', 'expired'] }
    }),
    EmergencyAccess.countDocuments({ flaggedForReview: true }),
    EmergencyAccess.find()
      .sort({ requestedAt: -1 })
      .limit(5)
      .populate('doctor', 'personalInfo professionalInfo')
      .populate('patient', 'personalInfo')
  ]);

  res.json({
    success: true,
    data: {
      totalRequests,
      activeAccesses,
      expiredAccesses,
      revokedAccesses,
      unreviewedCount,
      flaggedCount,
      recentRequests
    }
  });
});

// @desc    Check if doctor has active emergency access to patient
// @route   GET /api/emergency-access/check/:patientId
// @access  Private (Doctor)
export const checkEmergencyAccess = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const hasAccess = await EmergencyAccess.hasActiveAccess(req.user.userId, patientId);
  const activeAccess = await EmergencyAccess.getActiveAccess(req.user.userId, patientId);

  res.json({
    success: true,
    hasAccess,
    data: activeAccess || null
  });
});
