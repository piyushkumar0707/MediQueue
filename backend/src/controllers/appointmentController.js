import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

// @desc    Book an appointment
// @route   POST /api/appointments
// @access  Private (Patient)
export const bookAppointment = asyncHandler(async (req, res) => {
  const {
    doctorId,
    appointmentDate,
    timeSlot,
    reasonForVisit,
    symptoms,
    type
  } = req.body;

  // Validate doctor exists
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Check if time slot is available
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: new Date(appointmentDate),
    'timeSlot.startTime': timeSlot.startTime,
    status: { $in: ['scheduled', 'confirmed', 'checked-in', 'in-progress'] }
  });

  if (existingAppointment) {
    return res.status(400).json({
      success: false,
      message: 'This time slot is already booked'
    });
  }

  // Create appointment
  const appointment = await Appointment.create({
    patient: req.user._id,
    doctor: doctorId,
    appointmentDate: new Date(appointmentDate),
    timeSlot,
    reasonForVisit,
    symptoms: symptoms || [],
    type: type || 'consultation'
  });

  await appointment.populate([
    { path: 'patient', select: 'personalInfo phoneNumber email' },
    { path: 'doctor', select: 'personalInfo professionalInfo' }
  ]);

  logger.info(`Appointment booked: ${appointment._id} by patient ${req.user.email}`);

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully',
    data: appointment
  });
});

// @desc    Get patient's appointments
// @route   GET /api/appointments/my-appointments
// @access  Private (Patient)
export const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, upcoming } = req.query;

  const query = { patient: req.user._id };
  
  if (status) {
    query.status = status;
  }

  if (upcoming === 'true') {
    query.appointmentDate = { $gte: new Date() };
    query.status = { $in: ['scheduled', 'confirmed'] };
  }

  const appointments = await Appointment.find(query)
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('queueEntry')
    .sort({ appointmentDate: -1 });

  res.json({
    success: true,
    data: appointments
  });
});

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor-appointments
// @access  Private (Doctor)
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { date, status } = req.query;

  const query = { doctor: req.user._id };

  if (status) {
    query.status = status;
  }

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: startDate, $lte: endDate };
  } else {
    // Default to today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    query.appointmentDate = { $gte: today, $lt: tomorrow };
  }

  const appointments = await Appointment.find(query)
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('queueEntry')
    .sort({ 'timeSlot.startTime': 1 });

  res.json({
    success: true,
    data: appointments
  });
});

// @desc    Get available time slots for a doctor
// @route   GET /api/appointments/available-slots/:doctorId
// @access  Private
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required'
    });
  }

  // Validate doctor
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Get all booked appointments for the date
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    appointmentDate: { $gte: startDate, $lte: endDate },
    status: { $in: ['scheduled', 'confirmed', 'checked-in', 'in-progress'] }
  }).select('timeSlot');

  // Generate all possible time slots (9 AM to 5 PM, 30 min slots)
  const allSlots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const endHour = minute === 30 ? hour + 1 : hour;
      const endMinute = minute === 30 ? 0 : 30;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      allSlots.push({
        startTime,
        endTime,
        available: true
      });
    }
  }

  // Mark booked slots as unavailable
  const bookedTimes = new Set(bookedAppointments.map(apt => apt.timeSlot.startTime));
  allSlots.forEach(slot => {
    if (bookedTimes.has(slot.startTime)) {
      slot.available = false;
    }
  });

  res.json({
    success: true,
    data: {
      date,
      doctor: {
        _id: doctor._id,
        name: doctor.personalInfo.fullName,
        specialization: doctor.professionalInfo?.specialization
      },
      slots: allSlots
    }
  });
});

// @desc    Update appointment status
// @route   PATCH /api/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, cancelReason } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check authorization
  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this appointment'
    });
  }

  appointment.status = status;
  if (cancelReason) appointment.cancelReason = cancelReason;

  await appointment.save();

  logger.info(`Appointment ${appointment._id} status updated to ${status} by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Appointment status updated',
    data: appointment
  });
});

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private (Patient/Doctor)
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { cancelReason } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check authorization
  const isPatient = appointment.patient.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this appointment'
    });
  }

  appointment.status = 'cancelled';
  appointment.cancelReason = cancelReason || 'No reason provided';
  await appointment.save();

  logger.info(`Appointment ${appointment._id} cancelled by ${req.user.email}`);

  res.json({
    success: true,
    message: 'Appointment cancelled successfully'
  });
});

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('queueEntry');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check authorization
  const isPatient = appointment.patient._id.toString() === req.user._id.toString();
  const isDoctor = appointment.doctor._id.toString() === req.user._id.toString();

  if (!isPatient && !isDoctor && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this appointment'
    });
  }

  res.json({
    success: true,
    data: appointment
  });
});
