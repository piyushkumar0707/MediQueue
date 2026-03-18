import 'dotenv/config'; // Must be first — loads .env before any other module initializes
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import redisClient from './config/redis.js';
import { validateEnv } from './config/validateEnv.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import notificationService from './services/notificationService.js';
import emailService from './services/emailService.js';
import { initializeAppointmentSchedulers } from './services/appointmentScheduler.js';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/user.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import queueRoutes from './routes/queue.routes.js';
import recordRoutes from './routes/record.routes.js';
import consentRoutes from './routes/consent.routes.js';
import emergencyAccessRoutes from './routes/emergencyAccess.routes.js';
import prescriptionRoutes from './routes/prescription.routes.js';
import auditRoutes from './routes/audit.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import adminRoutes from './routes/admin.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import { verifyAccessToken } from './utils/jwt.js';

// Validate environment variables before starting
validateEnv();

// Build CORS allowlist — supports comma-separated origins for multi-env (staging + prod)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOriginFn = (origin, callback) => {
  // Allow server-to-server and direct curl requests (no origin header)
  if (!origin || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
};

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: corsOriginFn,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize notification service with Socket.io
notificationService.setSocketIO(io);

// Initialize email service
emailService.initialize();

// Trust proxy if behind load balancer (for x-forwarded-proto)
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// HTTPS redirect (MUST be first middleware, before helmet)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && req.protocol !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],     // API server — no scripts, styles, or embeds needed
      frameAncestors: ["'none'"], // Prevent clickjacking
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  } : false
})); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: corsOriginFn,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) },
  skip: (req) => req.url === '/health' || req.url === '/api/health',
}));

// Make io accessible to routes
app.set('io', io);

// Health check routes (both /health and /api/health for compatibility)
const healthHandler = async (req, res) => {
  const checks = {
    mongodb: 'unhealthy',
    redis: 'unhealthy',
  };

  // MongoDB: readyState 1 = connected
  try {
    const { readyState } = mongoose.connection;
    checks.mongodb = readyState === 1 ? 'healthy' : 'unhealthy';
  } catch {
    checks.mongodb = 'unhealthy';
  }

  // Redis: ping roundtrip
  try {
    const pong = await redisClient.ping();
    checks.redis = pong === 'PONG' ? 'healthy' : 'unhealthy';
  } catch {
    checks.redis = 'unhealthy';
  }

  const allHealthy = Object.values(checks).every((s) => s === 'healthy');
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/records', recordRoutes);
app.use('/api/v1/consent', consentRoutes);
app.use('/api/v1/emergency-access', emergencyAccessRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.io connection handling
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Unauthorized: no token provided'));
  }
  try {
    const decoded = verifyAccessToken(token);
    socket.user = decoded; // { userId, role, ... }
    next();
  } catch (err) {
    next(new Error('Unauthorized: invalid token'));
  }
});

io.on('connection', (socket) => {
  const { userId, role } = socket.user; // from verified token — never trust client
  logger.info(`Client connected: ${socket.id} user:${userId} role:${role}`);

  // Join rooms using server-verified identity — client-sent values are ignored
  socket.on('join', () => {
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
    logger.info(`User ${userId} (${role}) joined rooms`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id} user:${userId}`);
  });
});

// Connect to database and Redis, then start server
const PORT = process.env.PORT || 5000;

const connectRedis = () => {
  // ioredis with lazyConnect may already be connecting/connected — skip if so
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') {
    return Promise.resolve();
  }
  return redisClient.connect();
};

Promise.all([connectDB(), connectRedis()])
  .then(() => {
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Initialize appointment reminder schedulers
      initializeAppointmentSchedulers();
      logger.info('Appointment reminder schedulers initialized');
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

// Handle synchronous uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown on SIGTERM (Docker/Kubernetes/Heroku stop) and SIGINT (Ctrl+C)
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (err) {
      logger.error('Error closing Redis:', err);
    }
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { io };
