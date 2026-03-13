import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import User from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Generate MFA setup (TOTP secret + QR code)
 * @route   POST /api/auth/mfa/setup
 * @access  Protected
 */
export const setupMfa = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.mfaEnabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled. Disable it first to re-setup.'
      });
    }

    // Generate a new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `CareQueue (${user.email})`,
      issuer: 'CareQueue',
      length: 32
    });

    // Save the temp secret (not yet confirmed)
    user.mfaSecret = secret.base32;
    await user.save({ validateBeforeSave: false });

    // Generate QR code data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.status(200).json({
      success: true,
      message: 'Scan the QR code with your authenticator app, then verify with a TOTP code.',
      data: {
        qrCode: qrCodeUrl,
        manualKey: secret.base32  // Fallback for manual entry
      }
    });
  } catch (error) {
    logger.error('MFA setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to set up MFA' });
  }
};

/**
 * @desc    Verify TOTP code and enable MFA (completes setup)
 * @route   POST /api/auth/mfa/verify-setup
 * @access  Protected
 */
export const verifyMfaSetup = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id).select('+mfaSecret +mfaBackupCodes');

    if (!user.mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA setup not initiated. Call /mfa/setup first.'
      });
    }

    if (user.mfaEnabled) {
      return res.status(400).json({ success: false, message: 'MFA is already enabled.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1  // Allow 1 step (30s) clock drift
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid TOTP code. Please try again.' });
    }

    // Generate 8 single-use backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()  // e.g. "A3F7B2C1"
    );
    // Store hashed backup codes
    const hashedBackupCodes = backupCodes.map(code =>
      crypto.createHash('sha256').update(code).digest('hex')
    );

    user.mfaEnabled = true;
    user.mfaBackupCodes = hashedBackupCodes;
    await user.save({ validateBeforeSave: false });

    logger.info(`MFA enabled for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully. Save these backup codes — they will not be shown again.',
      data: { backupCodes }  // Plain-text, shown once
    });
  } catch (error) {
    logger.error('MFA verify-setup error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify MFA setup' });
  }
};

/**
 * @desc    Verify TOTP (or backup code) during login
 * @route   POST /api/auth/mfa/validate
 * @access  Public (requires mfaSessionToken in body)
 */
export const validateMfa = async (req, res) => {
  try {
    const { mfaSessionToken, token } = req.body;

    if (!mfaSessionToken || !token) {
      return res.status(400).json({ success: false, message: 'mfaSessionToken and token are required' });
    }

    // Decode session token (signed, 5-min TTL)
    let payload;
    try {
      const jwt = await import('jsonwebtoken');
      payload = jwt.default.verify(mfaSessionToken, process.env.JWT_ACCESS_SECRET);
      if (payload.type !== 'mfa_session') throw new Error('Invalid token type');
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired MFA session' });
    }

    const user = await User.findById(payload.userId).select('+mfaSecret +mfaBackupCodes');

    if (!user || !user.mfaEnabled) {
      return res.status(400).json({ success: false, message: 'MFA not enabled for this account' });
    }

    // Try TOTP first
    const isTotpValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    let usedBackup = false;

    if (!isTotpValid) {
      // Try backup codes
      const hashedInput = crypto.createHash('sha256').update(token.toUpperCase()).digest('hex');
      const backupIndex = (user.mfaBackupCodes || []).indexOf(hashedInput);

      if (backupIndex === -1) {
        return res.status(401).json({ success: false, message: 'Invalid MFA code' });
      }

      // Consume (remove) the used backup code
      user.mfaBackupCodes.splice(backupIndex, 1);
      usedBackup = true;
    }

    // Attach session data (userId, role) to res.locals for the token generation below
    // Import helpers lazily to avoid circular deps
    const { generateTokenPair } = await import('../utils/jwt.js');
    const { default: AuditLog } = await import('../models/AuditLog.js');

    const { accessToken, refreshToken } = generateTokenPair(user);

    await user.addRefreshToken(refreshToken, req.headers['user-agent'], req.ip);

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();

    await AuditLog.create({
      userId: user._id,
      action: 'LOGIN_MFA',
      category: 'AUTH',
      description: `User ${user.email} completed MFA login${usedBackup ? ' (backup code)' : ''}`,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      status: 'SUCCESS'
    });

    await user.save({ validateBeforeSave: false });

    // Set httpOnly cookies
    const COOKIE_OPTIONS = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    };
    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 2 * 60 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    user.password = undefined;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = undefined;

    logger.info(`MFA validated for user: ${user.email}${usedBackup ? ' (backup code used)' : ''}`);

    res.status(200).json({
      success: true,
      message: 'MFA verified. Login successful.',
      data: { user, accessToken, refreshToken }
    });
  } catch (error) {
    logger.error('MFA validate error:', error);
    res.status(500).json({ success: false, message: 'MFA validation failed' });
  }
};

/**
 * @desc    Disable MFA (requires current TOTP to confirm)
 * @route   POST /api/auth/mfa/disable
 * @access  Protected
 */
export const disableMfa = async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findById(req.user.id).select('+mfaSecret +mfaBackupCodes');

    if (!user.mfaEnabled) {
      return res.status(400).json({ success: false, message: 'MFA is not enabled.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid TOTP code. Provide a current code to disable MFA.' });
    }

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    user.mfaBackupCodes = undefined;
    await user.save({ validateBeforeSave: false });

    logger.info(`MFA disabled for user: ${user.email}`);

    res.status(200).json({ success: true, message: 'MFA disabled successfully.' });
  } catch (error) {
    logger.error('MFA disable error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable MFA' });
  }
};
