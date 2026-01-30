import { asyncHandler } from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

/**
 * @desc    Get all audit logs with filters
 * @route   GET /api/audit/logs
 * @access  Private (Admin)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    userId, 
    action, 
    category,
    startDate,
    endDate,
    search 
  } = req.query;

  const query = {};

  // Filters
  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (category) query.category = category;

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Search in description
  if (search) {
    query.description = { $regex: search, $options: 'i' };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'email personalInfo.firstName personalInfo.lastName role')
      .populate('targetUserId', 'email personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip),
    AuditLog.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * @desc    Get audit log statistics
 * @route   GET /api/audit/stats
 * @access  Private (Admin)
 */
export const getAuditStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  // Total logs in period
  const totalLogs = await AuditLog.countDocuments({
    createdAt: { $gte: startDate }
  });

  // Logs by category
  const logsByCategory = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  // Logs by action
  const logsByAction = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // Logs by status
  const logsByStatus = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Most active users
  const activeUsers = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: '$userId',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        email: '$user.email',
        name: {
          $concat: [
            '$user.personalInfo.firstName',
            ' ',
            '$user.personalInfo.lastName'
          ]
        },
        role: '$user.role',
        activityCount: '$count'
      }
    }
  ]);

  // Daily activity trend
  const dailyActivity = await AuditLog.aggregate([
    {
      $match: { createdAt: { $gte: startDate } }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.date': 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      totalLogs,
      logsByCategory,
      logsByAction,
      logsByStatus,
      activeUsers,
      dailyActivity,
      period: {
        days: parseInt(days),
        startDate
      }
    }
  });
});

/**
 * @desc    Get user activity logs
 * @route   GET /api/audit/user/:userId
 * @access  Private (Admin)
 */
export const getUserActivityLogs = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find({ userId })
      .populate('targetUserId', 'email personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip),
    AuditLog.countDocuments({ userId })
  ]);

  // Get user info
  const user = await User.findById(userId).select('email personalInfo role');

  res.json({
    success: true,
    data: {
      user,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Create audit log (utility function for internal use)
 * @access  Internal
 */
export const createAuditLog = async (logData) => {
  try {
    await AuditLog.create(logData);
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};

/**
 * @desc    Get recent security events
 * @route   GET /api/audit/security
 * @access  Private (Admin)
 */
export const getSecurityEvents = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  // Failed login attempts
  const failedLogins = await AuditLog.find({
    action: 'LOGIN',
    status: 'FAILURE',
    createdAt: { $gte: startDate }
  })
    .populate('userId', 'email personalInfo')
    .sort({ createdAt: -1 })
    .limit(50);

  // Suspicious activities (multiple failed logins from same user)
  const suspiciousActivities = await AuditLog.aggregate([
    {
      $match: {
        action: 'LOGIN',
        status: 'FAILURE',
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$userId',
        failedAttempts: { $sum: 1 },
        lastAttempt: { $max: '$createdAt' }
      }
    },
    {
      $match: {
        failedAttempts: { $gte: 3 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $sort: { failedAttempts: -1 }
    }
  ]);

  // Account status changes
  const statusChanges = await AuditLog.find({
    action: 'USER_STATUS_CHANGED',
    createdAt: { $gte: startDate }
  })
    .populate('userId', 'email personalInfo')
    .populate('targetUserId', 'email personalInfo')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: {
      failedLogins,
      suspiciousActivities,
      statusChanges
    }
  });
});
