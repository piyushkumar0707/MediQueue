import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to protect routes - requires valid access token.
 * Supports Authorization header (Bearer) and httpOnly cookie fallback.
 */
export const protect = async (req, res, next) => {
  try {
    // Support Authorization header first, then cookie fallback
    let token = extractTokenFromHeader(req.headers.authorization);
    if (!token && req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

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

    // Check if user still exists in DB
    const user = await User.findById(decoded.userId).select('-password -mfaSecret');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated' });
    }

    // Check if password was changed after token was issued
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password was recently changed. Please login again.'
      });
    }

    // Update last active time (non-blocking)
    User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() }).catch(err =>
      logger.warn(`Failed to update lastActiveAt for user ${user._id}: ${err.message}`)
    );

    req.user = decoded;
    req.userDoc = user;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Authentication failed', error: error.message });
  }
};

/**
 * Middleware to authorize specific roles.
 * @param  {...String} roles - Allowed roles (patient, doctor, admin)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
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
