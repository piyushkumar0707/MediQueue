import { asyncHandler } from '../utils/asyncHandler.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

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
    logger.error('Error creating audit log:', error);
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
    action: 'LOGIN_FAILED',
    createdAt: { $gte: startDate }
  })
    .populate('userId', 'email personalInfo')
    .sort({ createdAt: -1 })
    .limit(50);

  // Suspicious activities (multiple failed logins from same user)
  const suspiciousActivities = await AuditLog.aggregate([
    {
      $match: {
        action: 'LOGIN_FAILED',
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

/**
 * @desc    Get HIPAA compliance report
 * @route   GET /api/audit/compliance/hipaa
 * @access  Private (Admin)
 */
export const getHIPAAComplianceReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Get all HIPAA-relevant logs
  const hipaaLogs = await AuditLog.getHIPAALogs(start, end);

  // Count by action type
  const actionCounts = await AuditLog.aggregate([
    {
      $match: {
        isHIPAARelevant: true,
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // PHI access summary
  const phiAccessSummary = await AuditLog.aggregate([
    {
      $match: {
        action: { $in: ['RECORD_ACCESSED', 'RECORD_DOWNLOADED', 'RECORD_VIEWED'] },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$userId',
        accessCount: { $sum: 1 }
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
        accessCount: 1
      }
    },
    {
      $sort: { accessCount: -1 }
    }
  ]);

  // Emergency access summary
  const emergencyAccessSummary = await AuditLog.getEmergencyAccessReport(start, end);

  // Consent activity
  const consentActivity = await AuditLog.aggregate([
    {
      $match: {
        category: 'CONSENT',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      period: { start, end },
      summary: {
        totalHIPAALogs: hipaaLogs.length,
        phiAccessCount: phiAccessSummary.reduce((sum, item) => sum + item.accessCount, 0),
        emergencyAccessCount: emergencyAccessSummary.length,
        consentChanges: consentActivity.reduce((sum, item) => sum + item.count, 0)
      },
      actionCounts,
      phiAccessSummary,
      emergencyAccessSummary,
      consentActivity,
      detailedLogs: hipaaLogs.slice(0, 100) // First 100 for performance
    }
  });
});

/**
 * @desc    Get emergency access compliance report
 * @route   GET /api/audit/compliance/emergency
 * @access  Private (Admin)
 */
export const getEmergencyAccessReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const emergencyLogs = await AuditLog.find({
    category: 'EMERGENCY',
    createdAt: { $gte: start, $lte: end }
  })
    .populate('userId', 'email personalInfo role')
    .populate('targetUserId', 'email personalInfo')
    .sort({ createdAt: -1 });

  // Summary by action
  const summaryByAction = await AuditLog.aggregate([
    {
      $match: {
        category: 'EMERGENCY',
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  // By doctor
  const byDoctor = await AuditLog.aggregate([
    {
      $match: {
        category: 'EMERGENCY',
        action: { $in: ['EMERGENCY_ACCESS_CREATED', 'EMERGENCY_ACCESS_USED'] },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$userId',
        emergencyAccessCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'doctor'
      }
    },
    {
      $unwind: '$doctor'
    },
    {
      $project: {
        doctorId: '$_id',
        email: '$doctor.email',
        name: {
          $concat: [
            '$doctor.personalInfo.firstName',
            ' ',
            '$doctor.personalInfo.lastName'
          ]
        },
        emergencyAccessCount: 1
      }
    },
    {
      $sort: { emergencyAccessCount: -1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      period: { start, end },
      totalEmergencyAccess: emergencyLogs.length,
      summaryByAction,
      byDoctor,
      detailedLogs: emergencyLogs
    }
  });
});

/**
 * @desc    Get record access summary report
 * @route   GET /api/audit/compliance/record-access
 * @access  Private (Admin)
 */
export const getRecordAccessReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const recordAccessReport = await AuditLog.getRecordAccessReport(start, end);

  // Most accessed patients
  const mostAccessedPatients = await AuditLog.aggregate([
    {
      $match: {
        action: { $in: ['RECORD_ACCESSED', 'RECORD_DOWNLOADED', 'RECORD_VIEWED'] },
        createdAt: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$targetUserId',
        accessCount: { $sum: 1 },
        uniqueAccessors: { $addToSet: '$userId' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'patient'
      }
    },
    {
      $unwind: '$patient'
    },
    {
      $project: {
        patientId: '$_id',
        patientEmail: '$patient.email',
        patientName: {
          $concat: [
            '$patient.personalInfo.firstName',
            ' ',
            '$patient.personalInfo.lastName'
          ]
        },
        accessCount: 1,
        uniqueAccessorCount: { $size: '$uniqueAccessors' }
      }
    },
    {
      $sort: { accessCount: -1 }
    },
    {
      $limit: 20
    }
  ]);

  res.json({
    success: true,
    data: {
      period: { start, end },
      recordAccessSummary: recordAccessReport,
      mostAccessedPatients
    }
  });
});

/**
 * @desc    Export audit logs to CSV
 * @route   GET /api/audit/export
 * @access  Private (Admin)
 */
export const exportAuditLogs = asyncHandler(async (req, res) => {
  const { startDate, endDate, format = 'csv' } = req.query;
  
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  const logs = await AuditLog.find({
    createdAt: { $gte: start, $lte: end }
  })
    .populate('userId', 'email personalInfo role')
    .populate('targetUserId', 'email personalInfo')
    .sort({ createdAt: -1 })
    .limit(10000); // Limit for performance

  if (format === 'csv') {
    // Generate CSV
    const csvRows = [
      ['Timestamp', 'User', 'Role', 'Action', 'Category', 'Description', 'Target User', 'Status', 'Severity', 'IP Address', 'HIPAA Relevant']
    ];

    logs.forEach(log => {
      const user = log.userId ? `${log.userId.personalInfo?.firstName || ''} ${log.userId.personalInfo?.lastName || ''} (${log.userId.email})` : 'N/A';
      const targetUser = log.targetUserId ? `${log.targetUserId.personalInfo?.firstName || ''} ${log.targetUserId.personalInfo?.lastName || ''} (${log.targetUserId.email})` : 'N/A';
      
      csvRows.push([
        log.createdAt.toISOString(),
        user,
        log.userId?.role || 'N/A',
        log.action,
        log.category,
        log.description,
        targetUser,
        log.status,
        log.severity,
        log.ipAddress || 'N/A',
        log.isHIPAARelevant ? 'Yes' : 'No'
      ]);
    });

    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } else {
    // JSON format
    res.json({
      success: true,
      data: logs,
      count: logs.length
    });
  }
});
