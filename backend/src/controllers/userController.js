import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all doctors with optional filters
// @route   GET /api/users/doctors
// @access  Public/Private
export const getDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, available, page = 1, limit = 20 } = req.query;

  const query = { role: 'doctor', isActive: true };

  // Filter by specialization
  if (specialization && specialization !== 'all') {
    const escapedSpec = specialization.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query['professionalInfo.specialization'] = new RegExp(escapedSpec, 'i');
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

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [doctors, total] = await Promise.all([
    User.find(query)
      .select('personalInfo professionalInfo email phoneNumber')
      .sort({ 'personalInfo.firstName': 1 })
      .limit(limitNum)
      .skip(skip),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: doctors.length,
    data: doctors,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
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
      message: 'Doctor not found'
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
  const { personalInfo, professionalInfo } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update personal info
  if (personalInfo) {
    user.personalInfo = { ...user.personalInfo, ...personalInfo };
  }

  // Update professional info (doctors only)
  if (professionalInfo && user.role === 'doctor') {
    user.professionalInfo = { ...user.professionalInfo, ...professionalInfo };
  }

  await user.save();

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

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
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
