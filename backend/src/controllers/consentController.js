import Consent from '../models/Consent.js';
import User from '../models/User.js';
import MedicalRecord from '../models/MedicalRecord.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get my consents (patient view)
// @route   GET /api/consent/my-consents
// @access  Private (Patient)
export const getMyConsents = asyncHandler(async (req, res) => {
  const consents = await Consent.find({ patient: req.user.userId })
    .populate('doctor', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization email')
    .populate('specificRecords', 'title recordType')
    .sort({ createdAt: -1 });

  // Transform doctor data to flatten personalInfo
  const transformedConsents = consents.map(consent => {
    const obj = consent.toObject();
    if (obj.doctor && obj.doctor.personalInfo) {
      obj.doctor = {
        _id: obj.doctor._id,
        firstName: obj.doctor.personalInfo.firstName,
        lastName: obj.doctor.personalInfo.lastName,
        specialization: obj.doctor.professionalInfo?.specialization,
        email: obj.doctor.email
      };
    }
    return obj;
  });

  res.json({
    success: true,
    count: transformedConsents.length,
    data: transformedConsents
  });
});

// @desc    Get consents for my patients (doctor view)
// @route   GET /api/consent/for-my-patients
// @access  Private (Doctor)
export const getDoctorConsents = asyncHandler(async (req, res) => {
  const consents = await Consent.find({ 
    doctor: req.user.userId,
    status: 'active'
  })
    .populate('patient', 'personalInfo.firstName personalInfo.lastName email phoneNumber')
    .sort({ createdAt: -1 });

  // Transform patient data
  const transformedConsents = consents.map(consent => {
    const obj = consent.toObject();
    if (obj.patient && obj.patient.personalInfo) {
      obj.patient = {
        _id: obj.patient._id,
        firstName: obj.patient.personalInfo.firstName,
        lastName: obj.patient.personalInfo.lastName,
        email: obj.patient.email,
        phoneNumber: obj.patient.phoneNumber
      };
    }
    return obj;
  });

  res.json({
    success: true,
    count: transformedConsents.length,
    data: transformedConsents
  });
});

// @desc    Grant consent to a doctor
// @route   POST /api/consent/grant
// @access  Private (Patient)
export const grantConsent = asyncHandler(async (req, res) => {
  const {
    doctorId,
    scope,
    specificRecords,
    recordTypes,
    permissions,
    expiresAt,
    purpose
  } = req.body;

  // Validate doctor exists and is a doctor
  const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
  if (!doctor) {
    return res.status(400).json({
      success: false,
      message: 'Invalid doctor ID or doctor is inactive'
    });
  }

  // Check if consent already exists
  const existingConsent = await Consent.findOne({
    patient: req.user.userId,
    doctor: doctorId,
    status: 'active'
  });

  if (existingConsent) {
    return res.status(400).json({
      success: false,
      message: 'Active consent already exists for this doctor. Please revoke it first to create a new one.'
    });
  }

  // Validate specific records if scope is specific-records
  if (scope === 'specific-records' && specificRecords && specificRecords.length > 0) {
    const records = await MedicalRecord.find({
      _id: { $in: specificRecords },
      patient: req.user.userId
    });
    if (records.length !== specificRecords.length) {
      return res.status(400).json({
        success: false,
        message: 'Some specified records do not belong to you or do not exist'
      });
    }
  }

  // Create consent
  const consent = await Consent.create({
    patient: req.user.userId,
    doctor: doctorId,
    scope: scope || 'all-records',
    specificRecords: scope === 'specific-records' ? specificRecords : [],
    recordTypes: scope === 'record-types' ? recordTypes : [],
    permissions: permissions || { canView: true, canDownload: true, canShare: false },
    expiresAt: expiresAt || null,
    purpose: purpose || '',
    consentGivenMethod: 'manual'
  });

  await consent.populate('doctor', 'personalInfo.firstName personalInfo.lastName professionalInfo.specialization');

  // Transform doctor data
  const transformedConsent = consent.toObject();
  if (transformedConsent.doctor && transformedConsent.doctor.personalInfo) {
    transformedConsent.doctor = {
      _id: transformedConsent.doctor._id,
      firstName: transformedConsent.doctor.personalInfo.firstName,
      lastName: transformedConsent.doctor.personalInfo.lastName,
      specialization: transformedConsent.doctor.professionalInfo?.specialization
    };
  }

  res.status(201).json({
    success: true,
    message: 'Consent granted successfully',
    data: transformedConsent
  });
});

// @desc    Revoke consent
// @route   DELETE /api/consent/:id
// @access  Private (Patient)
export const revokeConsent = asyncHandler(async (req, res) => {
  const consent = await Consent.findById(req.params.id);

  if (!consent) {
    return res.status(404).json({
      success: false,
      message: 'Consent not found'
    });
  }

  // Check if user is the patient
  if (consent.patient.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to revoke this consent'
    });
  }

  if (consent.status === 'revoked') {
    return res.status(400).json({
      success: false,
      message: 'Consent is already revoked'
    });
  }

  await consent.revoke(req.user.userId, req.body.reason || 'Revoked by patient');

  res.json({
    success: true,
    message: 'Consent revoked successfully',
    data: consent
  });
});

// @desc    Update consent
// @route   PATCH /api/consent/:id
// @access  Private (Patient)
export const updateConsent = asyncHandler(async (req, res) => {
  const { permissions, expiresAt, purpose } = req.body;

  const consent = await Consent.findById(req.params.id);

  if (!consent) {
    return res.status(404).json({
      success: false,
      message: 'Consent not found'
    });
  }

  // Check if user is the patient
  if (consent.patient.toString() !== req.user.userId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to update this consent'
    });
  }

  if (consent.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update revoked or expired consent'
    });
  }

  // Update fields
  if (permissions) {
    consent.permissions = { ...consent.permissions, ...permissions };
  }
  if (expiresAt !== undefined) {
    consent.expiresAt = expiresAt;
  }
  if (purpose !== undefined) {
    consent.purpose = purpose;
  }

  await consent.save();
  await consent.populate('doctor', 'personalInfo.firstName personalInfo.lastName');

  // Transform doctor data
  const transformedConsent = consent.toObject();
  if (transformedConsent.doctor && transformedConsent.doctor.personalInfo) {
    transformedConsent.doctor = {
      _id: transformedConsent.doctor._id,
      firstName: transformedConsent.doctor.personalInfo.firstName,
      lastName: transformedConsent.doctor.personalInfo.lastName
    };
  }

  res.json({
    success: true,
    message: 'Consent updated successfully',
    data: transformedConsent
  });
});

// @desc    Get consent history and access logs
// @route   GET /api/consent/:id/history
// @access  Private (Patient/Doctor)
export const getConsentHistory = asyncHandler(async (req, res) => {
  const consent = await Consent.findById(req.params.id)
    .populate('patient', 'personalInfo.firstName personalInfo.lastName')
    .populate('doctor', 'personalInfo.firstName personalInfo.lastName')
    .populate('accessLog.recordId', 'title recordType');

  if (!consent) {
    return res.status(404).json({
      success: false,
      message: 'Consent not found'
    });
  }

  // Check if user has access
  const isPatient = consent.patient._id.toString() === req.user.userId;
  const isDoctor = consent.doctor._id.toString() === req.user.userId;
  const isAdmin = req.user.role === 'admin';

  if (!isPatient && !isDoctor && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to view this consent'
    });
  }

  res.json({
    success: true,
    data: consent
  });
});

// @desc    Check if doctor has consent for a record
// @route   GET /api/consent/check/:patientId/:recordId
// @access  Private (Doctor)
export const checkConsent = asyncHandler(async (req, res) => {
  const { patientId, recordId } = req.params;

  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'Record not found'
    });
  }

  const hasConsent = await Consent.hasConsent(
    req.user.userId,
    patientId,
    recordId,
    record.recordType
  );

  res.json({
    success: true,
    hasConsent,
    message: hasConsent ? 'Consent exists' : 'No valid consent found'
  });
});

// @desc    Get consent statistics (for patient dashboard)
// @route   GET /api/consent/stats
// @access  Private (Patient)
export const getConsentStats = asyncHandler(async (req, res) => {
  const [activeConsents, totalConsents, recentAccess] = await Promise.all([
    Consent.countDocuments({ patient: req.user.userId, status: 'active' }),
    Consent.countDocuments({ patient: req.user.userId }),
    Consent.aggregate([
      {
        $match: {
          patient: req.user.userId,
          'accessLog.0': { $exists: true }
        }
      },
      { $unwind: '$accessLog' },
      { $sort: { 'accessLog.accessedAt': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      { $unwind: '$doctor' }
    ])
  ]);

  res.json({
    success: true,
    data: {
      activeConsents,
      totalConsents,
      revokedConsents: totalConsents - activeConsents,
      recentAccess: recentAccess.map(item => ({
        doctor: {
          firstName: item.doctor.personalInfo?.firstName,
          lastName: item.doctor.personalInfo?.lastName
        },
        action: item.accessLog.action,
        accessedAt: item.accessLog.accessedAt
      }))
    }
  });
});
