import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import EmergencyAccess from '../models/EmergencyAccess.js';
import Prescription from '../models/Prescription.js';
import Consent from '../models/Consent.js';
import MedicalRecord from '../models/MedicalRecord.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { invalidateUserCache, getOrSetCache } from '../utils/userCache.js';
import { parsePagination } from '../utils/pagination.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ADMIN_STATS_CACHE_KEY = 'admin:stats:v1';
const ADMIN_STATS_CACHE_TTL_SECONDS = 45;

const invalidateAdminStatsCache = async () => {
  try {
    await redisClient.del(ADMIN_STATS_CACHE_KEY);
  } catch (err) {
    logger.warn(`Admin stats cache invalidation failed: ${err.message}`);
  }
};

const buildAdminStatsPayload = async () => {
  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalAdmins,
    totalAppointments,
    scheduledAppointments,
    completedAppointments,
    activeQueue,
    totalEmergencyRequests,
    flaggedEmergency,
    activeEmergency,
    unreviewed
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'patient' }),
    User.countDocuments({ role: 'doctor' }),
    User.countDocuments({ role: 'admin' }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: { $in: ['scheduled', 'confirmed'] } }),
    Appointment.countDocuments({ status: 'completed' }),
    Queue.countDocuments({ status: { $in: ['waiting', 'in-progress'] } }),
    EmergencyAccess.countDocuments(),
    EmergencyAccess.countDocuments({ flaggedForReview: true }),
    EmergencyAccess.countDocuments({ status: 'approved' }),
    EmergencyAccess.countDocuments({ status: 'pending' })
  ]);

  // Get today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await Appointment.countDocuments({
    appointmentDate: { $gte: today, $lt: tomorrow }
  });

  return {
    users: {
      total: totalUsers,
      patients: totalPatients,
      doctors: totalDoctors,
      admins: totalAdmins
    },
    appointments: {
      total: totalAppointments,
      scheduled: scheduledAppointments,
      completed: completedAppointments,
      today: todayAppointments
    },
    queue: {
      active: activeQueue
    },
    emergencyAccess: {
      total: totalEmergencyRequests,
      flagged: flaggedEmergency,
      active: activeEmergency,
      unreviewed
    }
  };
};

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const data = await getOrSetCache(
    ADMIN_STATS_CACHE_KEY,
    ADMIN_STATS_CACHE_TTL_SECONDS,
    buildAdminStatsPayload
  );
  const durationMs = Date.now() - startedAt;

  logger.info('Admin stats served', {
    route: '/api/v1/admin/stats',
    adminUserId: req.user?.userId,
    durationMs,
    cacheTtlSeconds: ADMIN_STATS_CACHE_TTL_SECONDS
  });

  res.json({
    success: true,
    data
  });
});

/**
 * @desc    Get recent users
 * @route   GET /api/admin/recent-users
 * @access  Private (Admin)
 */
export const getRecentUsers = asyncHandler(async (req, res) => {
  const startedAt = Date.now();
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  
  const users = await User.find()
    .select('personalInfo email role createdAt isActive')
    .sort({ createdAt: -1 })
    .limit(limit);

  logger.info('Admin recent users served', {
    route: '/api/v1/admin/recent-users',
    adminUserId: req.user?.userId,
    limit,
    durationMs: Date.now() - startedAt
  });

  res.json({
    success: true,
    data: users
  });
});

/**
 * @desc    Get all users with filtering
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, search } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 20);
  
  const query = {};
  
  if (role) {
    query.role = role;
  }
  
  if (status === 'active') {
    query.isActive = true;
  } else if (status === 'inactive') {
    query.isActive = false;
  }
  
  if (search) {
    const escapedSearch = escapeRegex(search);
    query.$or = [
      { email: { $regex: escapedSearch, $options: 'i' } },
      { 'personalInfo.firstName': { $regex: escapedSearch, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: escapedSearch, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('personalInfo email role phoneNumber isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: users.length,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Update user status
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  user.isActive = isActive;
  await user.save({ validateModifiedOnly: true });

  // Invalidate auth cache so deactivated users are rejected on next request
  await invalidateUserCache(user._id.toString());
  await invalidateAdminStatsCache();

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: user
  });
});

/**
 * @desc    Create new user
 * @route   POST /api/admin/users
 * @access  Private (Admin)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, role, phoneNumber, personalInfo, professionalInfo } = req.body;
  
  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email or phone number already exists'
    });
  }
  
  // Create user
  const userData = {
    email,
    password,
    role,
    phoneNumber,
    countryCode: '+91',
    personalInfo,
    isActive: true,
    isEmailVerified: true,
    isPhoneVerified: true
  };
  
  if (role === 'doctor' && professionalInfo) {
    userData.professionalInfo = professionalInfo;
  }
  
  const user = await User.create(userData);
  await invalidateAdminStatsCache();

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 * @access  Private (Admin)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { personalInfo, professionalInfo, role, phoneNumber } = req.body;
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Update phone number if provided
  if (phoneNumber) {
    user.phoneNumber = phoneNumber;
  }
  
  // Update personal info
  if (personalInfo) {
    user.personalInfo = { ...user.personalInfo, ...personalInfo };
  }
  
  // Update professional info for doctors
  if (role === 'doctor' && professionalInfo) {
    user.professionalInfo = { ...user.professionalInfo, ...professionalInfo };
  }
  
  await user.save({ validateModifiedOnly: true });
  await invalidateAdminStatsCache();

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  if (user._id.toString() === req.user.userId) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  }

  const userId = user._id;
  await Promise.all([
    Appointment.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] }),
    Queue.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] }),
    Prescription.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] }),
    Consent.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] }),
    EmergencyAccess.deleteMany({ $or: [{ patient: userId }, { doctor: userId }] }),
    MedicalRecord.deleteMany({ patient: userId }),
    MedicalRecord.updateMany({ 'sharedWith.doctor': userId }, { $pull: { sharedWith: { doctor: userId } } }),
    Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] }),
  ]);

  await user.deleteOne();
  await invalidateAdminStatsCache();
  res.json({ success: true, message: 'User and related data deleted successfully' });
});
