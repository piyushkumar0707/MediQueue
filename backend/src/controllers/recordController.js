import MedicalRecord from '../models/MedicalRecord.js';
import User from '../models/User.js';
import Consent from '../models/Consent.js';
import EmergencyAccess from '../models/EmergencyAccess.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { generateEncryptionKey } from '../services/encryption.service.js';
import { getFileInfo, deleteFile } from '../middleware/upload.js';
import path from 'path';
import { generateMedicalRecordPDF } from '../services/pdfGenerators.js';

// @desc    Upload medical record
// @route   POST /api/records
// @access  Private (Patient/Doctor)
export const uploadRecord = asyncHandler(async (req, res) => {
  const { patientId, recordType, title, description, recordDate, metadata, visibility } = req.body;

  // Helper to clean up already-uploaded Cloudinary files on early exit
  const cleanupFiles = () => {
    if (req.files) {
      req.files.forEach(file => {
        const isImage = file.mimetype?.startsWith('image/');
        deleteFile(file.filename, isImage ? 'image' : 'raw');
      });
    }
  };

  // Validate patient exists
  const patient = await User.findById(patientId);
  if (!patient || patient.role !== 'patient') {
    cleanupFiles();
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
    cleanupFiles();
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
  
  let records = [];
  
  // If admin, get all records
  if (req.user.role === 'admin') {
    const query = {
      patient: patientId,
      status: 'active'
    };
    
    if (recordType && recordType !== 'all') {
      query.recordType = recordType;
    }
    
    records = await MedicalRecord.find(query)
      .populate('uploadedBy', 'personalInfo role')
      .populate('patient', 'personalInfo email phoneNumber')
      .sort({ recordDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
  } 
  // If doctor, check for explicit shares, active consent, AND emergency access
  else if (req.user.role === 'doctor') {
    // Get records explicitly shared with this doctor
    const sharedQuery = {
      patient: patientId,
      status: 'active',
      'sharedWith.doctor': req.user.userId
    };
    
    if (recordType && recordType !== 'all') {
      sharedQuery.recordType = recordType;
    }
    
    const explicitlySharedRecords = await MedicalRecord.find(sharedQuery)
      .populate('uploadedBy', 'personalInfo role')
      .populate('patient', 'personalInfo email phoneNumber')
      .sort({ recordDate: -1 });
    
    // Check for active consent
    const activeConsent = await Consent.findOne({
      patient: patientId,
      doctor: req.user.userId,
      status: 'active',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    let consentBasedRecords = [];
    
    if (activeConsent) {
      let consentQuery = {
        patient: patientId,
        status: 'active'
      };
      
      // Apply scope-based filtering
      if (activeConsent.scope === 'record-types' && activeConsent.recordTypes && activeConsent.recordTypes.length > 0) {
        consentQuery.recordType = { $in: activeConsent.recordTypes };
      }
      
      // Apply record type filter if provided
      if (recordType && recordType !== 'all') {
        if (consentQuery.recordType) {
          // If already has record type from consent, intersect with requested type
          if (activeConsent.recordTypes.includes(recordType)) {
            consentQuery.recordType = recordType;
          } else {
            consentQuery.recordType = { $in: [] }; // No match
          }
        } else {
          consentQuery.recordType = recordType;
        }
      }
      
      consentBasedRecords = await MedicalRecord.find(consentQuery)
        .populate('uploadedBy', 'personalInfo role')
        .populate('patient', 'personalInfo email phoneNumber')
        .sort({ recordDate: -1 });
    }
    
    // Check for active emergency access
    const emergencyAccess = await EmergencyAccess.getActiveAccess(req.user.userId, patientId);
    let emergencyBasedRecords = [];
    
    if (emergencyAccess) {
      let emergencyQuery = {
        patient: patientId,
        status: 'active'
      };
      
      if (recordType && recordType !== 'all') {
        emergencyQuery.recordType = recordType;
      }
      
      emergencyBasedRecords = await MedicalRecord.find(emergencyQuery)
        .populate('uploadedBy', 'personalInfo role')
        .populate('patient', 'personalInfo email phoneNumber')
        .sort({ recordDate: -1 });
    }
    
    // Combine and deduplicate
    const allRecords = [...explicitlySharedRecords, ...consentBasedRecords, ...emergencyBasedRecords];
    const uniqueRecords = Array.from(
      new Map(allRecords.map(record => [record._id.toString(), record])).values()
    );
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    records = uniqueRecords.slice(startIndex, endIndex);
  }
  
  const count = records.length;
  
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
  const { page = 1, limit = 10, recordType } = req.query;
  
  // Get records explicitly shared with this doctor
  const explicitlySharedRecords = await MedicalRecord.getSharedWithDoctor(req.user.userId);
  
  // Get active consents for this doctor
  const activeConsents = await Consent.find({
    doctor: req.user.userId,
    status: 'active',
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('patient');
  
  // For each active consent, get records based on consent scope
  const consentBasedRecords = [];
  
  for (const consent of activeConsents) {
    let query = {
      patient: consent.patient._id,
      status: 'active'
    };
    
    // Apply scope-based filtering
    if (consent.scope === 'record-types' && consent.recordTypes && consent.recordTypes.length > 0) {
      query.recordType = { $in: consent.recordTypes };
    }
    // If scope is 'all-records', no additional filtering needed
    // If scope is 'specific-records', would need to check specificRecords array
    
    const records = await MedicalRecord.find(query)
      .populate('patient', 'personalInfo email phoneNumber')
      .populate('uploadedBy', 'personalInfo')
      .sort({ recordDate: -1 });
    
    consentBasedRecords.push(...records);
  }
  
  // Get active emergency accesses for this doctor
  const emergencyAccesses = await EmergencyAccess.find({
    doctor: req.user.userId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).populate('patient');
  
  // For each active emergency access, get all records for that patient
  const emergencyBasedRecords = [];
  
  for (const emergencyAccess of emergencyAccesses) {
    const records = await MedicalRecord.find({
      patient: emergencyAccess.patient._id,
      status: 'active'
    })
      .populate('patient', 'personalInfo email phoneNumber')
      .populate('uploadedBy', 'personalInfo')
      .sort({ recordDate: -1 });
    
    emergencyBasedRecords.push(...records);
  }
  
  // Combine and deduplicate records (using record ID)
  const allRecords = [...explicitlySharedRecords, ...consentBasedRecords, ...emergencyBasedRecords];
  const uniqueRecords = Array.from(
    new Map(allRecords.map(record => [record._id.toString(), record])).values()
  );
  
  // Apply record type filter if provided
  let filteredRecords = uniqueRecords;
  if (recordType && recordType !== 'all') {
    filteredRecords = uniqueRecords.filter(record => record.recordType === recordType);
  }
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedRecords,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredRecords.length / limit),
      totalItems: filteredRecords.length
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
  
  // Check access - Allow patient, uploader, admin, explicitly shared doctors, doctors with active consent, or doctors with emergency access
  let hasAccess = false;
  let accessSource = null; // Track how access was granted
  
  // Check basic access (patient, uploader, admin, explicitly shared)
  if (record.canUserAccess(req.user.userId, req.user.role)) {
    hasAccess = true;
    accessSource = 'basic';
  }
  
  // If not already granted access and user is a doctor, check for active consent
  if (!hasAccess && req.user.role === 'doctor') {
    const activeConsent = await Consent.findOne({
      patient: record.patient._id,
      doctor: req.user.userId,
      status: 'active',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    if (activeConsent) {
      // Check if consent covers this record
      if (activeConsent.scope === 'all-records') {
        hasAccess = true;
        accessSource = 'consent';
      } else if (activeConsent.scope === 'record-types' && 
                 activeConsent.recordTypes && 
                 activeConsent.recordTypes.includes(record.recordType)) {
        hasAccess = true;
        accessSource = 'consent';
      } else if (activeConsent.scope === 'specific-records' && 
                 activeConsent.specificRecords && 
                 activeConsent.specificRecords.some(id => id.toString() === record._id.toString())) {
        hasAccess = true;
        accessSource = 'consent';
      }
      
      // Log consent access
      if (hasAccess) {
        await activeConsent.logAccess('viewed', record._id, req.ip);
      }
    }
  }
  
  // If still no access and user is a doctor, check for active emergency access
  if (!hasAccess && req.user.role === 'doctor') {
    const emergencyAccess = await EmergencyAccess.getActiveAccess(req.user.userId, record.patient._id);
    
    if (emergencyAccess) {
      hasAccess = true;
      accessSource = 'emergency';
      
      // Log emergency access
      await emergencyAccess.logAccess(record._id, record.recordType, 'viewed', req.ip);
    }
  }
  
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this record'
    });
  }
  
  // Log access
  await record.logAccess(req.user.userId, 'view', req.ip);
  
  // Transform populated data for frontend
  const transformedRecord = {
    ...record.toObject(),
    patient: record.patient ? {
      _id: record.patient._id,
      firstName: record.patient.personalInfo?.firstName,
      lastName: record.patient.personalInfo?.lastName,
      email: record.patient.email,
      phoneNumber: record.patient.phoneNumber
    } : null,
    uploadedBy: record.uploadedBy ? {
      _id: record.uploadedBy._id,
      firstName: record.uploadedBy.personalInfo?.firstName,
      lastName: record.uploadedBy.personalInfo?.lastName,
      role: record.uploadedBy.role
    } : null,
    sharedWith: record.sharedWith.map(share => ({
      ...share.toObject(),
      doctor: share.doctor ? {
        _id: share.doctor._id,
        firstName: share.doctor.personalInfo?.firstName,
        lastName: share.doctor.personalInfo?.lastName,
        specialization: share.doctor.professionalInfo?.specialization
      } : null
    }))
  };
  
  res.json({
    success: true,
    data: transformedRecord
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

// @desc    Download medical record as PDF report
// @route   GET /api/records/:id/download-report
// @access  Private (Patient/Doctor with access)
export const downloadRecordReport = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('patient', 'personalInfo phone email')
    .populate('uploadedBy', 'personalInfo professionalInfo')
    .populate('sharedWith.doctor', 'personalInfo professionalInfo');

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Medical record not found'
    });
  }

  // Check authorization
  const userId = req.user.userId;
  const isPatient = record.patient._id.toString() === userId;
  const isUploader = record.uploadedBy._id.toString() === userId;
  const isSharedDoctor = record.sharedWith.some(share => share.doctor._id.toString() === userId);
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isUploader && !isSharedDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this record'
    });
  }

  try {
    // Generate PDF
    const pdfBuffer = await generateMedicalRecordPDF(
      record,
      record.patient,
      record.uploadedBy
    );

    // Set response headers
    const fileName = `medical-record-${record._id.toString().slice(-8)}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error downloading medical record PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF'
    });
  }
});
