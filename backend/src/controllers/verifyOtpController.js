import { verifyOTP } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';
import { getOTP, deleteOTP } from '../utils/otpStore.js';

/**
 * @desc    Verify OTP without completing registration
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOtpOnly = async (req, res) => {
  try {
    const { sessionId, otp } = req.body;
    
    if (!sessionId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and OTP are required'
      });
    }
    
    // Get OTP data from Redis
    const otpData = await getOTP(sessionId);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired session. Please request a new OTP.'
      });
    }
    
    // Verify OTP
    if (!verifyOTP(otp, otpData.otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }
    
    logger.info(`OTP verified successfully for session: ${sessionId}`);
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      verified: true
    });
    
  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};
