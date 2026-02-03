import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import notificationService from '../services/notificationService.js';
import { activityTypes, emitStatsUpdate } from '../utils/adminEvents.js';
import { generateAppointmentPDF } from '../services/pdfGenerators.js';

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

  // Validate appointment is not in the past
  const appointmentDateTime = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (appointmentDateTime < today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot book appointments in the past'
    });
  }
  
  // If appointment is today, check if time slot is not in the past
  if (appointmentDateTime.toDateString() === new Date().toDateString()) {
    const [slotHour, slotMinute] = timeSlot.startTime.split(':').map(Number);
    const now = new Date();
    const slotTime = new Date();
    slotTime.setHours(slotHour, slotMinute, 0, 0);
    
    if (slotTime <= now) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments in past time slots'
      });
    }
  }

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
  console.log('=== BOOK APPOINTMENT DEBUG ===');
  console.log('Patient ID from token:', req.user.userId);
  console.log('Doctor ID:', doctorId);
  console.log('Appointment Date:', appointmentDate);
  
  const appointment = await Appointment.create({
    patient: req.user.userId,
    doctor: doctorId,
    appointmentDate: new Date(appointmentDate),
    timeSlot,
    reasonForVisit,
    symptoms: symptoms || [],
    type: type || 'consultation'
  });

  console.log('Created appointment ID:', appointment._id);
  console.log('Appointment patient field:', appointment.patient);

  await appointment.populate([
    { path: 'patient', select: 'personalInfo phoneNumber email firstName lastName' },
    { path: 'doctor', select: 'personalInfo professionalInfo firstName lastName' }
  ]);

  logger.info(`Appointment booked: ${appointment._id} by patient ${req.user.email}`);

  // Emit real-time event to admin dashboard
  const io = req.app.get('io');
  if (io) {
    activityTypes.appointmentBooked(
      io,
      appointment,
      appointment.patient,
      appointment.doctor
    );
    
    // Emit updated appointment stats
    const totalAppointments = await Appointment.countDocuments();
    const scheduledAppointments = await Appointment.countDocuments({ 
      status: { $in: ['scheduled', 'confirmed'] } 
    });
    emitStatsUpdate(io, {
      totalAppointments,
      scheduledAppointments
    });
  }

  // Notify patient about successful booking
  const patientNotification = await Notification.create({
    recipient: req.user.userId,
    type: 'appointment_booked',
    title: 'Appointment Confirmed',
    message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} on ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot.startTime} has been confirmed.`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'appointment',
      entityId: appointment._id
    },
    actionUrl: `/patient/appointments`,
    channels: {
      inApp: true,
      email: true
    }
  });

  await notificationService.sendNotification(patientNotification);

  // Notify doctor about new appointment
  const doctorNotification = await Notification.create({
    recipient: doctorId,
    sender: req.user.userId,
    type: 'appointment_booked',
    title: 'New Appointment Booked',
    message: `${appointment.patient.firstName} ${appointment.patient.lastName} has booked an appointment on ${new Date(appointmentDate).toLocaleDateString()} at ${timeSlot.startTime}. Reason: ${reasonForVisit}`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'appointment',
      entityId: appointment._id
    },
    actionUrl: `/doctor/appointments`,
    channels: {
      inApp: true,
      email: true
    }
  });

  await notificationService.sendNotification(doctorNotification);

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

  console.log('=== GET MY APPOINTMENTS DEBUG ===');
  console.log('User ID from token:', req.user.userId);
  console.log('Query params:', { status, upcoming });

  const query = { patient: req.user.userId };
  
  if (status) {
    query.status = status;
  }

  if (upcoming === 'true') {
    query.appointmentDate = { $gte: new Date() };
    query.status = { $in: ['scheduled', 'confirmed'] };
  }

  console.log('MongoDB query:', JSON.stringify(query));

  const appointments = await Appointment.find(query)
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('queueEntry')
    .sort({ appointmentDate: -1 });

  console.log('Found appointments count:', appointments.length);
  console.log('Appointments:', JSON.stringify(appointments, null, 2));

  res.json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor-appointments
// @access  Private (Doctor)
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const { date, status } = req.query;

  console.log('=== GET DOCTOR APPOINTMENTS DEBUG ===');
  console.log('User ID from token:', req.user.userId);
  console.log('Query params:', { date, status });

  const query = { doctor: req.user.userId };

  if (status) {
    query.status = status;
  }

  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: startDate, $lte: endDate };
  }
  // Note: No date filter means get all appointments for this doctor

  console.log('MongoDB query:', JSON.stringify(query));

  const appointments = await Appointment.find(query)
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('queueEntry')
    .sort({ appointmentDate: 1, 'timeSlot.startTime': 1 });

  console.log('Found appointments count:', appointments.length);

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
  const isPatient = appointment.patient.toString() === req.user.userId.toString();
  const isDoctor = appointment.doctor.toString() === req.user.userId.toString();

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
  const isPatient = appointment.patient.toString() === req.user.userId.toString();
  const isDoctor = appointment.doctor.toString() === req.user.userId.toString();

  if (!isPatient && !isDoctor) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this appointment'
    });
  }

  appointment.status = 'cancelled';
  appointment.cancelReason = cancelReason || 'No reason provided';
  await appointment.save();

  await appointment.populate([
    { path: 'patient', select: 'firstName lastName email' },
    { path: 'doctor', select: 'firstName lastName email' }
  ]);

  logger.info(`Appointment ${appointment._id} cancelled by ${req.user.email}`);

  // Determine who cancelled and notify the other party
  const cancelledByPatient = isPatient;
  
  if (cancelledByPatient) {
    // Notify doctor
    const doctorNotification = await Notification.create({
      recipient: appointment.doctor._id,
      sender: req.user.userId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `${appointment.patient.firstName} ${appointment.patient.lastName} has cancelled their appointment scheduled for ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.timeSlot.startTime}. Reason: ${cancelReason || 'No reason provided'}`,
      priority: 'high',
      relatedEntity: {
        entityType: 'Appointment',
        entityId: appointment._id
      },
      actionUrl: `/doctor/appointments`,
      channels: {
        inApp: true,
        email: true
      }
    });

    await notificationService.sendNotification(doctorNotification);
  } else {
    // Notify patient
    const patientNotification = await Notification.create({
      recipient: appointment.patient._id,
      sender: req.user.userId,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} scheduled for ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.timeSlot.startTime} has been cancelled. Reason: ${cancelReason || 'No reason provided'}`,
      priority: 'high',
      relatedEntity: {
        entityType: 'Appointment',
        entityId: appointment._id
      },
      actionUrl: `/patient/appointments`,
      channels: {
        inApp: true,
        email: true
      }
    });

    await notificationService.sendNotification(patientNotification);
  }

  res.json({
    success: true,
    message: 'Appointment cancelled successfully'
  });
});

// @desc    Reschedule appointment
// @route   PATCH /api/appointments/:id/reschedule
// @access  Private (Patient)
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentDate, timeSlot } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check authorization - only patient can reschedule
  if (appointment.patient.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to reschedule this appointment'
    });
  }

  // Check if appointment is already cancelled or completed
  if (['cancelled', 'completed'].includes(appointment.status)) {
    return res.status(400).json({
      success: false,
      message: `Cannot reschedule ${appointment.status} appointment`
    });
  }

  // Validate new appointment date is not in the past
  const newAppointmentDate = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (newAppointmentDate < today) {
    return res.status(400).json({
      success: false,
      message: 'Cannot reschedule to a past date'
    });
  }

  // Check if the new time slot is available
  const conflictingAppointment = await Appointment.findOne({
    doctor: appointment.doctor,
    appointmentDate: newAppointmentDate,
    'timeSlot.startTime': timeSlot.startTime,
    status: { $in: ['scheduled', 'confirmed', 'checked-in', 'in-progress'] },
    _id: { $ne: appointment._id } // Exclude current appointment
  });

  if (conflictingAppointment) {
    return res.status(400).json({
      success: false,
      message: 'This time slot is already booked. Please select another slot.'
    });
  }

  // Update appointment
  appointment.appointmentDate = newAppointmentDate;
  appointment.timeSlot = timeSlot;
  await appointment.save();

  await appointment.populate([
    { path: 'patient', select: 'personalInfo phoneNumber email firstName lastName' },
    { path: 'doctor', select: 'personalInfo professionalInfo firstName lastName' }
  ]);

  logger.info(`Appointment ${appointment._id} rescheduled by patient ${req.user.userId}`);

  // Notify patient about successful reschedule
  const patientNotification = await Notification.create({
    recipient: req.user.userId,
    type: 'appointment_rescheduled',
    title: 'Appointment Rescheduled',
    message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} has been rescheduled to ${newAppointmentDate.toLocaleDateString()} at ${timeSlot.startTime}.`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Appointment',
      entityId: appointment._id
    },
    actionUrl: `/patient/appointments`,
    channels: {
      inApp: true,
      email: true
    }
  });

  await notificationService.sendNotification(patientNotification);

  // Notify doctor about rescheduled appointment
  const doctorNotification = await Notification.create({
    recipient: appointment.doctor._id,
    sender: req.user.userId,
    type: 'appointment_rescheduled',
    title: 'Appointment Rescheduled',
    message: `${appointment.patient.firstName} ${appointment.patient.lastName} has rescheduled their appointment to ${newAppointmentDate.toLocaleDateString()} at ${timeSlot.startTime}.`,
    priority: 'medium',
    relatedEntity: {
      entityType: 'Appointment',
      entityId: appointment._id
    },
    actionUrl: `/doctor/appointments`,
    channels: {
      inApp: true,
      email: true
    }
  });

  await notificationService.sendNotification(doctorNotification);

  res.json({
    success: true,
    message: 'Appointment rescheduled successfully',
    data: appointment
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

// @desc    Get patient appointments (for doctors)
// @route   GET /api/appointments/patient/:patientId
// @access  Private (Doctor)
export const getPatientAppointments = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  
  const appointments = await Appointment.find({ patient: patientId })
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('queueEntry')
    .sort({ appointmentDate: -1 });

  res.json({
    success: true,
    data: appointments
  });
});

// @desc    Download appointment confirmation as PDF
// @route   GET /api/appointments/:id/download
// @access  Private (Patient/Doctor)
export const downloadAppointmentConfirmation = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patient', 'personalInfo phone email')
    .populate('doctor', 'personalInfo professionalInfo phone');

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check authorization
  const userId = req.user.userId;
  const isPatient = appointment.patient._id.toString() === userId;
  const isDoctor = appointment.doctor._id.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this appointment'
    });
  }

  try {
    // Generate PDF
    const pdfBuffer = await generateAppointmentPDF(
      appointment,
      appointment.patient,
      appointment.doctor
    );

    // Set response headers
    const fileName = `appointment-${appointment._id.toString().slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error downloading appointment PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF'
    });
  }
});
