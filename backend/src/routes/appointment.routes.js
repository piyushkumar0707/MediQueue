import express from 'express';
import { createRateLimiter } from '../utils/rateLimiter.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAvailableSlots,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentById,
  rescheduleAppointment,
  getPatientAppointments,
  downloadAppointmentConfirmation
} from '../controllers/appointmentController.js';

const router = express.Router();

// Per-user rate limit for appointment bookings: 10 per hour
const bookingRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve reached the maximum of 10 appointment bookings per hour. Please wait a few minutes before booking another appointment.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-user rate limit for PDF confirmation downloads: 20 per hour
const downloadConfirmationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: { 
    success: false, 
    message: 'You\'ve downloaded appointment confirmations 20 times in the past hour. If you\'re having trouble opening the file, please contact support.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Patient routes
router.post('/', protect, authorize('patient'), bookingRateLimit, bookAppointment);
router.get('/my-appointments', protect, authorize('patient'), getMyAppointments);

// Doctor routes
router.get('/doctor-appointments', protect, authorize('doctor'), getDoctorAppointments);
router.get('/patient/:patientId', protect, authorize('doctor'), getPatientAppointments);

// Shared routes
router.get('/available-slots/:doctorId', protect, getAvailableSlots);
router.get('/:id/download', protect, downloadConfirmationRateLimit, downloadAppointmentConfirmation);
router.get('/:id', protect, getAppointmentById);
router.patch('/:id/status', protect, updateAppointmentStatus);
router.patch('/:id/reschedule', protect, authorize('patient'), rescheduleAppointment);
router.delete('/:id', protect, cancelAppointment);

export default router;

