import jwt from 'jsonwebtoken';
import { asyncHandler } from './errorHandler.js';

// Protect routes - verify JWT token
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  console.log('=== AUTH MIDDLEWARE DEBUG ===');
  console.log('Token present:', !!token);
  console.log('Token (first 20 chars):', token?.substring(0, 20));

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('JWT verification error:', error.message);
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// Authorize specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(
        `User role '${req.user.role}' is not authorized to access this route`
      );
    }
    next();
  };
};
