import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import { getOrSetCache } from '../utils/userCache.js';

const ANALYTICS_TTL = 300; // 5 minutes

/**
 * @desc    Get analytics overview data
 * @route   GET /api/analytics/overview
 * @access  Private (Admin)
 */
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const { startDate, endDate, period = '30' } = req.query;

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);

  const cacheKey = `analytics:overview:${start.toISOString()}:${end.toISOString()}`;

  const data = await getOrSetCache(cacheKey, ANALYTICS_TTL, async () => {
    const [
      totalUsers,
      newUsersInPeriod,
      usersByRole,
      totalAppointments,
      appointmentsByStatus,
      appointmentsByType,
      totalQueueEntries,
      queueByPriority,
      averageWaitTime
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Appointment.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$appointmentType', count: { $sum: 1 } } }
      ]),
      Queue.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Queue.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Queue.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
        { $project: { waitTime: { $subtract: [{ $ifNull: ['$checkedInAt', '$createdAt'] }, '$createdAt'] } } },
        { $group: { _id: null, avgWaitTime: { $avg: '$waitTime' } } }
      ])
    ]);

    return {
      users: { total: totalUsers, newInPeriod: newUsersInPeriod, byRole: usersByRole },
      appointments: { total: totalAppointments, byStatus: appointmentsByStatus, byType: appointmentsByType },
      queue: { total: totalQueueEntries, byPriority: queueByPriority, avgWaitTime: averageWaitTime[0]?.avgWaitTime || 0 },
      period: { start, end, days: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) }
    };
  });

  res.json({ success: true, data });
});

/**
 * @desc    Get user growth trends
 * @route   GET /api/analytics/user-growth
 * @access  Private (Admin)
 */
export const getUserGrowth = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  const cacheKey = `analytics:user-growth:${days}`;

  const data = await getOrSetCache(cacheKey, ANALYTICS_TTL, async () => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, role: '$role' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } }
    ]);
  });

  res.json({ success: true, data });
});

/**
 * @desc    Get appointment trends
 * @route   GET /api/analytics/appointment-trends
 * @access  Private (Admin)
 */
export const getAppointmentTrends = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  const cacheKey = `analytics:appointment-trends:${days}`;

  const data = await getOrSetCache(cacheKey, ANALYTICS_TTL, async () => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.date': 1 } }
    ]);
  });

  res.json({ success: true, data });
});

/**
 * @desc    Get queue performance metrics
 * @route   GET /api/analytics/queue-performance
 * @access  Private (Admin)
 */
export const getQueuePerformance = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  const cacheKey = `analytics:queue-performance:${days}`;

  const data = await getOrSetCache(cacheKey, ANALYTICS_TTL, async () => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Queue.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          totalEntries: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          emergency: { $sum: { $cond: [{ $eq: ['$priority', 'emergency'] }, 1, 0] } }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
  });

  res.json({ success: true, data });
});

/**
 * @desc    Get doctor performance metrics
 * @route   GET /api/analytics/doctor-performance
 * @access  Private (Admin)
 */
export const getDoctorPerformance = asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  const cacheKey = `analytics:doctor-performance:${days}`;

  const data = await getOrSetCache(cacheKey, ANALYTICS_TTL, async () => {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate }, doctorId: { $exists: true } } },
      { $lookup: { from: 'users', localField: 'doctorId', foreignField: '_id', as: 'doctor' } },
      { $unwind: '$doctor' },
      {
        $group: {
          _id: '$doctorId',
          doctorName: { $first: { $concat: ['$doctor.personalInfo.firstName', ' ', '$doctor.personalInfo.lastName'] } },
          specialty: { $first: '$doctor.professionalInfo.specialty' },
          totalAppointments: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      {
        $project: {
          doctorName: 1, specialty: 1, totalAppointments: 1, completed: 1, cancelled: 1,
          completionRate: { $multiply: [{ $divide: ['$completed', '$totalAppointments'] }, 100] }
        }
      },
      { $sort: { totalAppointments: -1 } }
    ]);
  });

  res.json({ success: true, data });
});
