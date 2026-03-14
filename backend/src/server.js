import 'dotenv/config'; // Must be first — loads .env before any other module initializes
import express from 'express';
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

// Validate environment variables before starting
validateEnv();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize notification service with Socket.io
notificationService.setSocketIO(io);

// Initialize email service
emailService.initialize();

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Make io accessible to routes
app.set('io', io);

// Health check routes (both /health and /api/health for compatibility)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/emergency-access', emergencyAccessRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

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
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // Join room for specific user/role
  socket.on('join', (data) => {
    const { userId, role, department } = data;
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);
    if (department) socket.join(`dept:${department}`);
    logger.info(`User ${userId} joined rooms`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Connect to database and Redis, then start server
const PORT = process.env.PORT || 5000;

Promise.all([connectDB(), redisClient.connect()])
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

export { io };
