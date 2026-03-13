import AuditLog from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to log audit events
 */
export const auditLogger = (action, category) => {
  return async (req, res, next) => {
    // Store original json function
    const originalJson = res.json.bind(res);

    // Override json function to capture response
    res.json = function (data) {
      // Only log if request was successful (status < 400)
      if (res.statusCode < 400) {
        const logData = {
          userId: req.user?._id,
          action,
          category,
          description: generateDescription(action, req, data),
          targetUserId: req.params?.userId || req.body?.userId,
          targetResource: extractResourceType(action),
          targetResourceId: extractResourceId(req, data),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('user-agent'),
          metadata: {
            method: req.method,
            path: req.path,
            body: sanitizeBody(req.body),
            params: req.params,
            query: req.query
          },
          status: 'SUCCESS'
        };

        // Create audit log asynchronously (don't block response)
        AuditLog.create(logData).catch(err => {
          logger.error('Error creating audit log:', err);
        });
      }

      // Call original json function
      return originalJson(data);
    };

    next();
  };
};

/**
 * Generate human-readable description based on action
 */
function generateDescription(action, req, data) {
  const user = req.user;
  const userName = `${user?.personalInfo?.firstName || ''} ${user?.personalInfo?.lastName || ''}`.trim() || user?.email;

  switch (action) {
    case 'LOGIN':
      return `User ${userName} logged in successfully`;
    case 'LOGOUT':
      return `User ${userName} logged out`;
    case 'USER_CREATED':
      return `Admin ${userName} created a new user: ${req.body?.email}`;
    case 'USER_UPDATED':
      return `Admin ${userName} updated user: ${data?.data?.email || 'unknown'}`;
    case 'USER_DELETED':
      return `Admin ${userName} deleted user`;
    case 'USER_STATUS_CHANGED':
      return `Admin ${userName} changed user status`;
    case 'APPOINTMENT_CREATED':
      return `User ${userName} created an appointment`;
    case 'APPOINTMENT_UPDATED':
      return `User ${userName} updated an appointment`;
    case 'APPOINTMENT_CANCELLED':
      return `User ${userName} cancelled an appointment`;
    case 'QUEUE_ENTRY_CREATED':
      return `User ${userName} created a queue entry`;
    case 'QUEUE_ENTRY_UPDATED':
      return `User ${userName} updated a queue entry`;
    case 'PRESCRIPTION_CREATED':
      return `Doctor ${userName} created a prescription`;
    case 'PASSWORD_CHANGED':
      return `User ${userName} changed their password`;
    case 'PROFILE_UPDATED':
      return `User ${userName} updated their profile`;
    case 'RECORD_ACCESSED':
      return `User ${userName} accessed a medical record`;
    case 'RECORD_CREATED':
      return `User ${userName} created a medical record`;
    case 'RECORD_UPDATED':
      return `User ${userName} updated a medical record`;
    default:
      return `User ${userName} performed action: ${action}`;
  }
}

/**
 * Extract resource type from action
 */
function extractResourceType(action) {
  if (action.includes('USER')) return 'User';
  if (action.includes('APPOINTMENT')) return 'Appointment';
  if (action.includes('QUEUE')) return 'Queue';
  if (action.includes('PRESCRIPTION')) return 'Prescription';
  if (action.includes('RECORD')) return 'Record';
  return null;
}

/**
 * Extract resource ID from request or response
 */
function extractResourceId(req, data) {
  // Try to get from params
  if (req.params?.id) return req.params.id;
  if (req.params?.userId) return req.params.userId;
  if (req.params?.appointmentId) return req.params.appointmentId;
  
  // Try to get from response data
  if (data?.data?._id) return data.data._id;
  if (data?.data?.id) return data.data.id;
  
  return null;
}

/**
 * Sanitize request body (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.currentPassword;
  delete sanitized.newPassword;
  delete sanitized.confirmPassword;
  delete sanitized.token;
  
  return sanitized;
}

/**
 * Log failed authentication attempts
 */
export const logFailedAuth = async (email, reason, req) => {
  try {
    await AuditLog.create({
      userId: null, // No user ID for failed login
      action: 'LOGIN',
      category: 'AUTH',
      description: `Failed login attempt for email: ${email}. Reason: ${reason}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        email,
        reason
      },
      status: 'FAILURE'
    });
  } catch (error) {
    logger.error('Error logging failed auth:', error);
  }
};
