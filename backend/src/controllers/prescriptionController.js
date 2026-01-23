import mongoose from 'mongoose';
import Prescription from '../models/Prescription.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';

// @desc    Create new prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
export const createPrescription = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, queueEntryId, diagnosis, medicines, tests, notes, followUpDate, followUpInstructions } = req.body;

  // Validate patient exists
  const patient = await User.findById(patientId);
  if (!patient || patient.role !== 'patient') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Validate appointment or queue entry if provided
  if (appointmentId) {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.doctor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create prescription for this appointment'
      });
    }
  }

  if (queueEntryId) {
    const queueEntry = await Queue.findById(queueEntryId);
    if (!queueEntry || queueEntry.doctor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to create prescription for this queue entry'
      });
    }
  }

  // Create prescription
  const prescription = await Prescription.create({
    patient: patientId,
    doctor: req.user.userId,
    appointment: appointmentId || null,
    queueEntry: queueEntryId || null,
    diagnosis,
    medicines,
    tests: tests || [],
    notes: notes || '',
    followUpDate: followUpDate || null,
    followUpInstructions: followUpInstructions || ''
  });

  // Populate patient and doctor info
  await prescription.populate([
    { path: 'patient', select: 'personalInfo phoneNumber email' },
    { path: 'doctor', select: 'personalInfo professionalInfo' }
  ]);

  logger.info(`Prescription created by Dr. ${req.user.userId} for patient ${patientId}`);

  res.status(201).json({
    success: true,
    message: 'Prescription created successfully',
    data: prescription
  });
});

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Patient/Doctor)
export const getPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('appointment');

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }

  // Check authorization - only patient or doctor can view
  const isPatient = prescription.patient._id.toString() === req.user.userId;
  const isDoctor = prescription.doctor._id.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to view this prescription'
    });
  }

  res.json({
    success: true,
    data: prescription
  });
});

// @desc    Get patient's prescriptions
// @route   GET /api/prescriptions/my-prescriptions
// @access  Private (Patient)
export const getMyPrescriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { patient: req.user.userId };
  if (status) {
    query.status = status;
  }

  const prescriptions = await Prescription.find(query)
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('appointment')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Prescription.countDocuments(query);

  res.json({
    success: true,
    data: prescriptions,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

// @desc    Get doctor's prescriptions
// @route   GET /api/prescriptions/doctor-prescriptions
// @access  Private (Doctor)
export const getDoctorPrescriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, patientId, status } = req.query;

  const query = { doctor: req.user.userId };
  if (patientId) {
    query.patient = patientId;
  }
  if (status) {
    query.status = status;
  }

  const prescriptions = await Prescription.find(query)
    .populate('patient', 'personalInfo phoneNumber email')
    .populate('appointment')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Prescription.countDocuments(query);

  res.json({
    success: true,
    data: prescriptions,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

// @desc    Get patient's prescription history (for doctor)
// @route   GET /api/prescriptions/patient/:patientId/history
// @access  Private (Doctor)
export const getPatientPrescriptionHistory = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify patient exists
  const patient = await User.findById(patientId);
  if (!patient || patient.role !== 'patient') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  const prescriptions = await Prescription.find({ patient: patientId })
    .populate('doctor', 'personalInfo professionalInfo')
    .populate('appointment')
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    data: prescriptions
  });
});

// @desc    Update prescription
// @route   PATCH /api/prescriptions/:id
// @access  Private (Doctor)
export const updatePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }

  // Check if doctor owns this prescription
  if (prescription.doctor.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to update this prescription'
    });
  }

  // Update fields
  const allowedUpdates = ['diagnosis', 'medicines', 'tests', 'notes', 'followUpDate', 'followUpInstructions', 'status', 'validUntil'];
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      prescription[field] = req.body[field];
    }
  });

  await prescription.save();

  await prescription.populate([
    { path: 'patient', select: 'personalInfo phoneNumber email' },
    { path: 'doctor', select: 'personalInfo professionalInfo' }
  ]);

  res.json({
    success: true,
    message: 'Prescription updated successfully',
    data: prescription
  });
});

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private (Doctor/Admin)
export const deletePrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: 'Prescription not found'
    });
  }

  // Check if doctor owns this prescription or is admin
  const isOwner = prescription.doctor.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to delete this prescription'
    });
  }

  await prescription.deleteOne();

  logger.info(`Prescription ${prescription._id} deleted by ${req.user.userId}`);

  res.json({
    success: true,
    message: 'Prescription deleted successfully'
  });
});

// @desc    Get prescription statistics
// @route   GET /api/prescriptions/stats
// @access  Private (Doctor)
export const getPrescriptionStats = asyncHandler(async (req, res) => {
  const stats = await Prescription.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: null,
        totalPrescriptions: { $sum: 1 },
        activePrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        completedPrescriptions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: stats[0] || {
      totalPrescriptions: 0,
      activePrescriptions: 0,
      completedPrescriptions: 0
    }
  });
});
