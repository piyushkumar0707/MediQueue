const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware to protect routes - requires valid access token
 */
exports.protect = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password -mfaSecret');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }
    
    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password was recently changed. Please login again.'
      });
    }
    
    // Update last active time (async, don't wait)
    User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() }).exec();
    
    // Attach user to request
    req.user = decoded;
    req.userDoc = user; // Full user document if needed
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Middleware to authorize specific roles
 * @param  {...String} roles - Allowed roles (patient, doctor, admin)
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.userId} to ${req.path}`);
      
      return res.status(403).json({
        success: false,
        message: `Access denied. This route requires one of the following roles: ${roles.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Middleware to check specific permissions
 * @param  {...String} permissions - Required permissions
 */
exports.requirePermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every(perm => userPermissions.includes(perm));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${permissions.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token, but decodes if present
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password -mfaSecret');
        
        if (user && user.isActive) {
          req.user = decoded;
          req.userDoc = user;
        }
      } catch (error) {
        // Silently fail - token invalid but route allows unauthenticated access
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
