import MedicalRecord from '../models/MedicalRecord.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { generateEncryptionKey } from '../services/encryption.service.js';
import { getFileInfo, deleteFile } from '../middleware/upload.js';
import path from 'path';

// @desc    Upload medical record
// @route   POST /api/records
// @access  Private (Patient/Doctor)
export const uploadRecord = asyncHandler(async (req, res) => {
  const { patientId, recordType, title, description, recordDate, metadata, visibility } = req.body;
  
  // Validate patient exists
  const patient = await User.findById(patientId);
  if (!patient || patient.role !== 'patient') {
    // Clean up uploaded files
    if (req.files) {
      req.files.forEach(file => deleteFile(file.path));
    }
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }
  
  // Check authorization
  const isOwnRecord = req.user.userId === patientId;
  const isDoctor = req.user.role === 'doctor';
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwnRecord && !isDoctor && !isAdmin) {
    if (req.files) {
      req.files.forEach(file => deleteFile(file.path));
    }
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to upload records for this patient'
    });
  }
  
  // Validate files
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'At least one file is required'
    });
  }
  
  // Process uploaded files
  const files = req.files.map(file => getFileInfo(file));
  
  // Generate encryption key for this record
  const encryptionKey = generateEncryptionKey();
  
  // Parse metadata if it's a string
  let parsedMetadata = {};
  if (metadata) {
    try {
      parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch (error) {
      parsedMetadata = {};
    }
  }
  
  // Create medical record
  const record = await MedicalRecord.create({
    patient: patientId,
    uploadedBy: req.user.userId,
    recordType: recordType || 'other',
    title,
    description: description || '',
    recordDate: recordDate || new Date(),
    files,
    metadata: parsedMetadata,
    isEncrypted: true,
    encryptionKey,
    visibility: visibility || 'private',
    status: 'active'
  });
  
  // Populate references
  await record.populate([
    { path: 'patient', select: 'personalInfo email phoneNumber' },
    { path: 'uploadedBy', select: 'personalInfo role' }
  ]);
  
  // Log access
  await record.logAccess(req.user.userId, 'upload', req.ip);
  
  logger.info(`Medical record uploaded by user ${req.user.userId} for patient ${patientId}`);
  
  res.status(201).json({
    success: true,
    message: 'Medical record uploaded successfully',
    data: record
  });
});

// @desc    Get my medical records (Patient)
// @route   GET /api/records/my-records
// @access  Private (Patient)
export const getMyRecords = asyncHandler(async (req, res) => {
  const { recordType, page = 1, limit = 10, sortBy = 'recordDate', order = 'desc' } = req.query;
  
  const query = {
    patient: req.user.userId,
    status: 'active'
  };
  
  if (recordType && recordType !== 'all') {
    query.recordType = recordType;
  }
  
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortOptions = { [sortBy]: sortOrder };
  
  const records = await MedicalRecord.find(query)
    .populate('uploadedBy', 'personalInfo role')
    .sort(sortOptions)
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await MedicalRecord.countDocuments(query);
  
  res.json({
    success: true,
    data: records,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

// @desc    Get patient records (Doctor with access)
// @route   GET /api/records/patient/:patientId
// @access  Private (Doctor/Admin)
export const getPatientRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { recordType, page = 1, limit = 10 } = req.query;
  
  // Validate patient exists
  const patient = await User.findById(patientId);
  if (!patient || patient.role !== 'patient') {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }
  
  const query = {
    patient: patientId,
    status: 'active'
  };
  
  // If doctor, only show records shared with them
  if (req.user.role === 'doctor') {
    query['sharedWith.doctor'] = req.user.userId;
  }
  
  if (recordType && recordType !== 'all') {
    query.recordType = recordType;
  }
  
  const records = await MedicalRecord.find(query)
    .populate('uploadedBy', 'personalInfo role')
    .populate('patient', 'personalInfo email phoneNumber')
    .sort({ recordDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await MedicalRecord.countDocuments(query);
  
  // Log access for each record
  for (const record of records) {
    await record.logAccess(req.user.userId, 'view', req.ip);
  }
  
  res.json({
    success: true,
    data: records,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalItems: count
    }
  });
});

// @desc    Get records shared with me (Doctor)
// @route   GET /api/records/shared-with-me
// @access  Private (Doctor)
export const getSharedRecords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const records = await MedicalRecord.getSharedWithDoctor(req.user.userId);
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedRecords = records.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedRecords,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(records.length / limit),
      totalItems: records.length
    }
  });
});

// @desc    Get single medical record
// @route   GET /api/records/:id
// @access  Private
export const getRecordById = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'personalInfo email phoneNumber')
    .populate('uploadedBy', 'personalInfo role')
    .populate('sharedWith.doctor', 'personalInfo professionalInfo');
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }
  
  // Check access
  if (!record.canUserAccess(req.user.userId, req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this record'
    });
  }
  
  // Log access
  await record.logAccess(req.user.userId, 'view', req.ip);
  
  res.json({
    success: true,
    data: record
  });
});

// @desc    Share record with doctor
// @route   POST /api/records/:id/share
// @access  Private (Patient/Admin)
export const shareRecord = asyncHandler(async (req, res) => {
  const { doctorId, expiresAt, canDownload = true } = req.body;
  
  const record = await MedicalRecord.findById(req.params.id);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }
  
  // Check authorization - only patient or admin can share
  const isOwner = record.patient.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to share this record'
    });
  }
  
  // Validate doctor exists
  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== 'doctor') {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }
  
  // Share the record
  await record.shareWith(doctorId, expiresAt, canDownload);
  
  // Log access
  await record.logAccess(req.user.userId, 'share', req.ip);
  
  logger.info(`Record ${record._id} shared with doctor ${doctorId} by user ${req.user.userId}`);
  
  res.json({
    success: true,
    message: 'Record shared successfully',
    data: record
  });
});

// @desc    Revoke record access
// @route   DELETE /api/records/:id/share/:doctorId
// @access  Private (Patient/Admin)
export const revokeAccess = asyncHandler(async (req, res) => {
  const { id, doctorId } = req.params;
  
  const record = await MedicalRecord.findById(id);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }
  
  // Check authorization
  const isOwner = record.patient.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to revoke access'
    });
  }
  
  // Revoke access
  await record.revokeAccess(doctorId);
  
  logger.info(`Record ${record._id} access revoked for doctor ${doctorId} by user ${req.user.userId}`);
  
  res.json({
    success: true,
    message: 'Access revoked successfully'
  });
});

// @desc    Update medical record
// @route   PATCH /api/records/:id
// @access  Private (Owner/Admin)
export const updateRecord = asyncHandler(async (req, res) => {
  const { title, description, recordType, metadata, visibility } = req.body;
  
  const record = await MedicalRecord.findById(req.params.id);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }
  
  // Check authorization
  const isOwner = record.patient.toString() === req.user.userId;
  const isUploader = record.uploadedBy.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isUploader && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to update this record'
    });
  }
  
  // Update fields
  if (title) record.title = title;
  if (description !== undefined) record.description = description;
  if (recordType) record.recordType = recordType;
  if (visibility) record.visibility = visibility;
  if (metadata) {
    const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    record.metadata = { ...record.metadata, ...parsedMetadata };
  }
  
  await record.save();
  
  // Log access
  await record.logAccess(req.user.userId, 'update', req.ip);
  
  res.json({
    success: true,
    message: 'Record updated successfully',
    data: record
  });
});

// @desc    Delete medical record (soft delete)
// @route   DELETE /api/records/:id
// @access  Private (Owner/Admin)
export const deleteRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);
  
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }
  
  // Check authorization
  const isOwner = record.patient.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to delete this record'
    });
  }
  
  // Soft delete
  record.status = 'deleted';
  await record.save();
  
  // Log access
  await record.logAccess(req.user.userId, 'delete', req.ip);
  
  logger.info(`Record ${record._id} deleted by user ${req.user.userId}`);
  
  res.json({
    success: true,
    message: 'Record deleted successfully'
  });
});

// @desc    Get record statistics
// @route   GET /api/records/stats
// @access  Private (Patient)
export const getRecordStats = asyncHandler(async (req, res) => {
  const stats = await MedicalRecord.aggregate([
    {
      $match: {
        patient: req.user.userId,
        status: 'active'
      }
    },
    {
      $group: {
        _id: '$recordType',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalRecords = await MedicalRecord.countDocuments({
    patient: req.user.userId,
    status: 'active'
  });
  
  const sharedCount = await MedicalRecord.countDocuments({
    patient: req.user.userId,
    status: 'active',
    'sharedWith.0': { $exists: true }
  });
  
  res.json({
    success: true,
    data: {
      totalRecords,
      sharedCount,
      byType: stats
    }
  });
});
