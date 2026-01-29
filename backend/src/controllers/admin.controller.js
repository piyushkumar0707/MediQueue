import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  // Get user counts by role
  const totalUsers = await User.countDocuments();
  const totalPatients = await User.countDocuments({ role: 'patient' });
  const totalDoctors = await User.countDocuments({ role: 'doctor' });
  const totalAdmins = await User.countDocuments({ role: 'admin' });

  // Get appointment stats
  const totalAppointments = await Appointment.countDocuments();
  const scheduledAppointments = await Appointment.countDocuments({ 
    status: { $in: ['scheduled', 'confirmed'] } 
  });
  const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

  // Get active queue count
  const activeQueue = await Queue.countDocuments({ 
    status: { $in: ['waiting', 'in-consultation'] } 
  });

  // Get today's appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayAppointments = await Appointment.countDocuments({
    appointmentDate: { $gte: today, $lt: tomorrow }
  });

  res.json({
    success: true,
    data: {
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
      }
    }
  });
});

/**
 * @desc    Get recent users
 * @route   GET /api/admin/recent-users
 * @access  Private (Admin)
 */
export const getRecentUsers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  const users = await User.find()
    .select('personalInfo email role createdAt isActive')
    .sort({ createdAt: -1 })
    .limit(limit);

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
    query.$or = [
      { email: { $regex: search, $options: 'i' } },
      { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
      { 'personalInfo.lastName': { $regex: search, $options: 'i' } }
    ];
  }
  
  const users = await User.find(query)
    .select('personalInfo email role phoneNumber isActive createdAt')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: users.length,
    data: users
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
  await user.save();

  res.json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: user
  });
});
