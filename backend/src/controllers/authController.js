import User from '../models/User.js';
import crypto from 'crypto';
import { generateTokenPair, verifyRefreshToken, generateOTP, hashOTP, verifyOTP, generateTempToken, verifyTempToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import AuditLog from '../models/AuditLog.js';
import { logFailedAuth } from '../middleware/auditLogger.js';
import { activityTypes, emitStatsUpdate } from '../utils/adminEvents.js';
import { setOTP, getOTP, deleteOTP } from '../utils/otpStore.js';
import emailService from '../services/emailService.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 2 * 60 * 60 * 1000 }); // 2h
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
};

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
    
    // Store OTP in Redis with 5-minute TTL
    await setOTP(sessionId, {
      otp: hashedOTP,
      phoneNumber,
      email,
      countryCode: countryCode || '+91',
    }, 5 * 60);
    
    // TODO [INCOMPLETE]: SMS delivery not wired up — Twilio notificationService exists
    // but is not called here. Implement: await notificationService.sendOTP(phoneNumber, otp)
    logger.info(`OTP generated for registration (phone: ${phoneNumber}, session: ${sessionId})`);
    
    // In development, return OTP (REMOVE IN PRODUCTION)
    const response = {
      success: true,
      message: 'OTP sent successfully',
      sessionId,
      otpSent: true
    };
    
    // OTP is logged server-side for dev inspection; never sent in response
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[DEV] Registration OTP for session ${sessionId}: ${otp}`);
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
    const otpData = await getOTP(sessionId);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session'
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
    await deleteOTP(sessionId);
    
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
    
    // Send email verification link
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save({ validateBeforeSave: false });
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const userName = user.personalInfo?.firstName || user.email;
    const { subject, html } = emailService.verificationEmail(userName, verificationUrl);
    emailService.sendEmail(user.email, subject, html).catch(err =>
      logger.error('Failed to send verification email:', err)
    );
    
    // Emit real-time event to admin dashboard
    const io = req.app.get('io');
    if (io) {
      activityTypes.userRegistration(io, user);
      
      // Emit updated stats
      const totalUsers = await User.countDocuments();
      const roleCount = await User.countDocuments({ role: user.role });
      emitStatsUpdate(io, {
        totalUsers,
        [`total${user.role.charAt(0).toUpperCase() + user.role.slice(1)}s`]: roleCount
      });
    }
    
    // Remove sensitive data
    user.password = undefined;
    user.mfaSecret = undefined;
    
    // Set httpOnly cookies (secure token storage)
    setAuthCookies(res, accessToken, refreshToken);

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
    
    // Validate input
    if (!phoneOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone/email and password are required'
      });
    }
    
    // Find user (includes password field)
    const user = await User.findByPhoneOrEmail(phoneOrEmail);
    
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
    const isPasswordValid = await user.comparePassword(password);
    
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
    
    // If MFA is enabled, issue a short-lived MFA session token instead of full tokens
    if (user.mfaEnabled) {
      const jwt = await import('jsonwebtoken');
      const mfaSessionToken = jwt.default.sign(
        { userId: user._id, type: 'mfa_session' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '5m' }
      );
      return res.status(200).json({
        success: true,
        mfaRequired: true,
        mfaSessionToken,
        message: 'MFA verification required. Submit your TOTP code to /api/auth/mfa/validate.'
      });
    }

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
    
    // Set httpOnly cookies (secure token storage)
    setAuthCookies(res, accessToken, refreshToken);

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
    // Support both body and cookie (cookie preferred for security)
    const tokenValue = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!tokenValue) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(tokenValue);
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
    const tokenExists = user.refreshTokens.some(t => t.token === tokenValue);
    
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    
    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);
    
    // Remove old refresh token and add new one
    await user.removeRefreshToken(tokenValue);
    await user.addRefreshToken(
      newRefreshToken,
      req.headers['user-agent'],
      req.ip
    );
    
    logger.info(`Token refreshed for user: ${user.email}`);
    
    // Set new httpOnly cookies
    setAuthCookies(res, accessToken, newRefreshToken);

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
    const tokenValue = req.cookies?.refreshToken || req.body.refreshToken;
    const user = await User.findById(req.user.userId);
    
    if (user && tokenValue) {
      await user.removeRefreshToken(tokenValue);
    }
    
    clearAuthCookies(res);
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
    
    clearAuthCookies(res);
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
    
    // Store OTP in Redis with 10-minute TTL
    await setOTP(sessionId, {
      otp: hashedOTP,
      userId: user._id.toString(),
    }, 10 * 60);
    
    // TODO [INCOMPLETE]: OTP delivery not wired up — neither SMS (Twilio) nor email
    // (Nodemailer) is called here. Implement: await notificationService.sendOTP() or emailService.sendOtpEmail()
    logger.info(`Password reset OTP generated (user: ${user.email}, session: ${sessionId})`);
    
    const response = {
      success: true,
      message: 'Password reset OTP sent successfully',
      sessionId
    };
    
    // OTP is logged server-side for dev inspection; never sent in response
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[DEV] Password reset OTP for session ${sessionId}: ${otp}`);
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
    const otpData = await getOTP(sessionId);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session'
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
    await deleteOTP(sessionId);
    
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

/**
 * @desc    Verify email address via token link
 * @route   GET /api/auth/verify-email?token=...
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.info(`Email verified for user: ${user.email}`);

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });

  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Email verification failed', error: error.message });
  }
};
