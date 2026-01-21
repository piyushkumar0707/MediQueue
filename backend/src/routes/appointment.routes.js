import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAvailableSlots,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointmentById
} from '../controllers/appointmentController.js';

const router = express.Router();

// Patient routes
router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/my-appointments', protect, authorize('patient'), getMyAppointments);

// Doctor routes
router.get('/doctor-appointments', protect, authorize('doctor'), getDoctorAppointments);

// Shared routes
router.get('/available-slots/:doctorId', protect, getAvailableSlots);
router.get('/:id', protect, getAppointmentById);
router.patch('/:id/status', protect, updateAppointmentStatus);
router.delete('/:id', protect, cancelAppointment);

export default router;
