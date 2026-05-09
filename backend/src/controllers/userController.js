import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { parsePagination } from '../utils/pagination.js';

// @desc    Get all doctors with optional filters
// @route   GET /api/users/doctors
// @access  Public/Private
export const getDoctors = asyncHandler(async (req, res) => {
  const { specialty, specialization, search, available } = req.query;
  const { page, limit, skip } = parsePagination(req.query, 20);

  const query = { role: 'doctor', isActive: true };

  // Filter by specialty (supports legacy query param "specialization")
  const specialtyFilter = specialty || specialization;
  if (specialtyFilter && specialtyFilter !== 'all') {
    const escapedSpec = specialtyFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query['professionalInfo.specialty'] = new RegExp(escapedSpec, 'i');
  }

  // Search by name or email
  if (search) {
    if (search.length > 50) {
      return res.status(400).json({ success: false, message: 'Search query too long' });
    }
    // Escape special regex characters to prevent ReDoS
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { 'personalInfo.firstName': new RegExp(escapedSearch, 'i') },
      { 'personalInfo.lastName': new RegExp(escapedSearch, 'i') },
      { email: new RegExp(escapedSearch, 'i') }
    ];
  }

  const [doctors, total] = await Promise.all([
    User.find(query)
      .select('personalInfo professionalInfo email phoneNumber')
      .sort({ 'personalInfo.firstName': 1 })
      .limit(limit)
      .skip(skip),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: doctors.length,
    data: doctors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get doctor by ID
// @route   GET /api/users/doctors/:id
// @access  Public/Private
export const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await User.findOne({
    _id: req.params.id,
    role: 'doctor'
  }).select('personalInfo professionalInfo email phoneNumber');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'This doctor is not available. Please select a different doctor from the list.'
    });
  }

  res.json({
    success: true,
    data: doctor
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId)
    .select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    personalInfo,
    professionalInfo,
    email,
    phoneNumber,
    countryCode,
  } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (typeof email === 'string') {
    user.email = email.trim().toLowerCase();
  }

  if (typeof phoneNumber === 'string') {
    user.phoneNumber = phoneNumber.trim();
  }

  if (typeof countryCode === 'string') {
    user.countryCode = countryCode.trim();
  }

  // Update personal info
  if (personalInfo) {
    const mergedPersonalInfo = { ...user.personalInfo, ...personalInfo };
    if (personalInfo.address) {
      mergedPersonalInfo.address = {
        ...user.personalInfo?.address,
        ...personalInfo.address,
      };
    }
    user.personalInfo = mergedPersonalInfo;
  }

  // Update professional info (doctors only)
  if (professionalInfo && user.role === 'doctor') {
    user.professionalInfo = { ...user.professionalInfo, ...professionalInfo };
  }

  await user.save({ validateModifiedOnly: true });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must include:\n• At least 8 characters\n• One uppercase letter (A-Z)\n• One lowercase letter (a-z)\n• One number (0-9)\n• One special character (@$!%*?&)'
    });
  }

  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Search patients by name or email (for doctors)
// @route   GET /api/users/patients/search?q=...
// @access  Private (Doctor)
export const searchPatients = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.json({ success: true, data: [] });
  }

  const terms = q.trim().split(/\s+/).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const termRegexes = terms.map(t => new RegExp(t, 'i'));

  // Each word must match at least one of: email, firstName, or lastName
  const wordConditions = termRegexes.map(r => ({
    $or: [
      { email: r },
      { 'personalInfo.firstName': r },
      { 'personalInfo.lastName': r },
    ],
  }));

  const patients = await User.find({
    role: 'patient',
    $and: wordConditions,
  })
    .select('personalInfo email phoneNumber _id')
    .limit(10);

  res.json({ success: true, data: patients });
});

// @desc    Get patient by ID (for doctors)
// @route   GET /api/users/patients/:id
// @access  Private (Doctor)
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await User.findById(req.params.id)
    .select('personalInfo professionalInfo medicalInfo email phoneNumber role');

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: patient
  });
});
