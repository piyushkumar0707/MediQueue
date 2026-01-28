import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate Access Token (2 hours expiry - testing)
 * @param {Object} payload - User data to include in token
 * @returns {String} JWT access token
 */
const generateAccessToken = (payload) => {
  const { id, role, permissions } = payload;
  
  return jwt.sign(
    {
      userId: id,
      role,
      permissions: permissions || [],
      type: 'access'
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || '2h',
      issuer: 'carequeue-api',
      audience: 'carequeue-client'
    }
  );
};

/**
 * Generate Refresh Token (7 days expiry)
 * @param {String} userId - User ID
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  const tokenId = crypto.randomBytes(16).toString('hex');
  
  return jwt.sign(
    {
      userId,
      tokenId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
      issuer: 'carequeue-api',
      audience: 'carequeue-client'
    }
  );
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (user) => {
  const accessToken = generateAccessToken({
    id: user._id,
    role: user.role,
    permissions: user.permissions
  });
  
  const refreshToken = generateRefreshToken(user._id);
  
  return { accessToken, refreshToken };
};

/**
 * Verify Access Token
 * @param {String} token - JWT access token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: 'carequeue-api',
      audience: 'carequeue-client'
    });
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify Refresh Token
 * @param {String} token - JWT refresh token
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'carequeue-api',
      audience: 'carequeue-client'
    });
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token has expired. Please login again.');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (for debugging)
 * @param {String} token - JWT token
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Extract token from Authorization header
 * @param {String} authHeader - Authorization header value
 * @returns {String|null} Token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

/**
 * Generate temporary token for registration/password reset (15 minutes)
 * @param {Object} data - Data to encode
 * @returns {String} Temporary token
 */
const generateTempToken = (data) => {
  return jwt.sign(
    { ...data, type: 'temp' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * Verify temporary token
 * @param {String} token - Temporary token
 * @returns {Object} Decoded data
 */
const verifyTempToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    
    if (decoded.type !== 'temp') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Temporary token has expired');
    }
    throw new Error('Invalid temporary token');
  }
};

/**
 * Check if token is about to expire (within 5 minutes)
 * @param {Object} decodedToken - Decoded JWT payload
 * @returns {Boolean}
 */
const isTokenExpiringSoon = (decodedToken) => {
  if (!decodedToken.exp) return false;
  
  const expiryTime = decodedToken.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return (expiryTime - currentTime) < fiveMinutes;
};

/**
 * Generate OTP (6-digit)
 * @returns {String} 6-digit OTP
 */
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hash OTP for storage
 * @param {String} otp - Plain OTP
 * @returns {String} Hashed OTP
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Verify OTP
 * @param {String} plainOTP - User-provided OTP
 * @param {String} hashedOTP - Stored hashed OTP
 * @returns {Boolean}
 */
const verifyOTP = (plainOTP, hashedOTP) => {
  const hash = hashOTP(plainOTP);
  return hash === hashedOTP;
};

export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
  generateTempToken,
  verifyTempToken,
  isTokenExpiringSoon,
  generateOTP,
  hashOTP,
  verifyOTP
};
