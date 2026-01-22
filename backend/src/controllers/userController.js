import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all doctors with optional filters
// @route   GET /api/users/doctors
// @access  Public/Private
export const getDoctors = asyncHandler(async (req, res) => {
  const { specialization, search, available } = req.query;

  const query = { role: 'doctor' };

  // Filter by specialization
  if (specialization && specialization !== 'all') {
    query['professionalInfo.specialization'] = new RegExp(specialization, 'i');
  }

  // Search by name or email
  if (search) {
    query.$or = [
      { 'personalInfo.fullName': new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }

  const doctors = await User.find(query)
    .select('personalInfo professionalInfo email phoneNumber')
    .sort({ 'personalInfo.firstName': 1 });

  res.json({
    success: true,
    count: doctors.length,
    data: doctors
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

  const user = await User.findById(req.user.id);

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
