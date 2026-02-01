import User from '../models/User.js';
import { generateTokenPair, verifyRefreshToken, generateOTP, hashOTP, verifyOTP, generateTempToken, verifyTempToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import AuditLog from '../models/AuditLog.js';
import { logFailedAuth } from '../middleware/auditLogger.js';

// Store OTPs temporarily (In production, use Redis)
const otpStore = new Map();

// Export for use in other controllers
export { otpStore };

/**
 * @desc    Initiate user registration (send OTP)
 * @route   POST /api/auth/register/initiate
 * @access  Public
 */
export const initiateRegistration = async (req, res) => {
  try {
    const { phoneNumber, countryCode, email } = req.body;
    
    // Validate required fields
    if (!phoneNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and email are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phoneNumber }, { email: email.toLowerCase() }]
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this phone number or email already exists'
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const sessionId = `reg_${Date.now()}_${phoneNumber}`;
    
    // Store OTP with expiry (5 minutes)
    otpStore.set(sessionId, {
      otp: hashedOTP,
      phoneNumber,
      email,
      countryCode: countryCode || '+91',
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    // TODO: Send OTP via SMS (integrate Twilio)
    logger.info(`OTP generated for registration: ${otp} (phone: ${phoneNumber})`);
    
    // In development, return OTP (REMOVE IN PRODUCTION)
    const response = {
      success: true,
      message: 'OTP sent successfully',
      sessionId,
      otpSent: true
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.otp = otp; // Only for testing
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    logger.error('Registration initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate registration',
      error: error.message
    });
  }
};

/**
 * @desc    Verify OTP and complete registration
 * @route   POST /api/auth/register/complete
 * @access  Public
 */
export const completeRegistration = async (req, res) => {
  try {
    const { sessionId, otp, role, personalInfo, password } = req.body;
    
    // Validate required fields
    if (!sessionId || !otp || !role || !personalInfo || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Verify OTP
    const otpData = otpStore.get(sessionId);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }
    
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(sessionId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }
    
    if (!verifyOTP(otp, otpData.otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }
    
    // Create user
    const user = await User.create({
      phoneNumber: otpData.phoneNumber,
      countryCode: otpData.countryCode,
      email: otpData.email,
      password,
      role,
      personalInfo,
      isPhoneVerified: true,
      isEmailVerified: false // Will verify via email later
    });
    
    // Clear OTP
    otpStore.delete(sessionId);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);
    
    // Store refresh token
    await user.addRefreshToken(
      refreshToken,
      req.headers['user-agent'],
      req.ip
    );
    
    // Update last login
    user.lastLoginAt = new Date();
    await user.save();
    
    logger.info(`User registered successfully: ${user.email}`);
    
    // Remove sensitive data
    user.password = undefined;
    user.mfaSecret = undefined;
    
    res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    logger.error('Registration completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { phoneOrEmail, password } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Phone/Email:', phoneOrEmail);
    console.log('Password length:', password?.length);
    
    // Validate input
    if (!phoneOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone/email and password are required'
      });
    }
    
    // Find user (includes password field)
    const user = await User.findByPhoneOrEmail(phoneOrEmail);
    
    console.log('User found:', !!user);
    if (user) {
      console.log('User email:', user.email);
      console.log('User role:', user.role);
      console.log('Password hash exists:', !!user.password);
      console.log('Password hash length:', user.password?.length);
    }
    
    if (!user) {
      await logFailedAuth(phoneOrEmail, 'User not found', req);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts. Try again later.'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Verify password
    console.log('Attempting password comparison...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      // Increment failed attempts
      await user.incLoginAttempts();
      await logFailedAuth(phoneOrEmail, 'Invalid password', req);
      
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }
    
    // TODO: If MFA is enabled, return mfaRequired: true and sessionId
    // For now, skip MFA
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);
    
    // Store refresh token
    await user.addRefreshToken(
      refreshToken,
      req.headers['user-agent'],
      req.ip
    );
    
    // Update last login
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    // Log successful login
    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN',
      category: 'AUTH',
      description: `User ${user.email} logged in successfully`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS'
    });
    
    await user.save({ validateBeforeSave: false });
    
    logger.info(`User logged in: ${user.email}`);
    
    // Remove sensitive data
    user.password = undefined;
    user.mfaSecret = undefined;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
    
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
    
    // Remove old refresh token and add new one
    await user.removeRefreshToken(refreshToken);
    await user.addRefreshToken(
      newRefreshToken,
      req.headers['user-agent'],
      req.ip
    );
    
    logger.info(`Token refreshed for user: ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
    
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      error: error.message
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user.userId);
    
    if (user && refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }
    
    logger.info(`User logged out: ${user?.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
    
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
export const logoutAll = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (user) {
      await user.removeAllRefreshTokens();
    }
    
    logger.info(`User logged out from all devices: ${user?.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
    
  } catch (error) {
    logger.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout from all devices',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

/**
 * @desc    Initiate password reset (send OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { phoneOrEmail } = req.body;
    
    if (!phoneOrEmail) {
      return res.status(400).json({
        success: false,
        message: 'Phone number or email is required'
      });
    }
    
    // Find user
    const user = await User.findByPhoneOrEmail(phoneOrEmail);
    
    if (!user) {
      // Don't reveal if user exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset OTP has been sent'
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const sessionId = `reset_${Date.now()}_${user._id}`;
    
    // Store OTP
    otpStore.set(sessionId, {
      otp: hashedOTP,
      userId: user._id.toString(),
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    
    // TODO: Send OTP via SMS/Email
    logger.info(`Password reset OTP generated: ${otp} (user: ${user.email})`);
    
    const response = {
      success: true,
      message: 'Password reset OTP sent successfully',
      sessionId
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.otp = otp;
    }
    
    res.status(200).json(response);
    
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { sessionId, otp, newPassword } = req.body;
    
    if (!sessionId || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Verify OTP
    const otpData = otpStore.get(sessionId);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }
    
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(sessionId);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }
    
    if (!verifyOTP(otp, otpData.otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Validate password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }
    
    // Update password
    const user = await User.findById(otpData.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    // Logout from all devices
    await user.removeAllRefreshTokens();
    
    // Clear OTP
    otpStore.delete(sessionId);
    
    logger.info(`Password reset successful for user: ${user.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
    });
    
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};
