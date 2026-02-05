import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';

// Registration Steps
const STEPS = {
  PHONE_EMAIL: 1,
  OTP_VERIFICATION: 2,
  ROLE_SELECTION: 3,
  PERSONAL_INFO: 4,
  PASSWORD: 5,
  SUCCESS: 6
};

const Register = () => {
  const navigate = useNavigate();
  const { initiateRegistration, completeRegistration, isLoading, error, clearError } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState(STEPS.PHONE_EMAIL);
  const [sessionId, setSessionId] = useState('');
  const [devOTP, setDevOTP] = useState(''); // For development only
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    countryCode: '+91',
    email: '',
    otp: '',
    role: '',
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: ''
    },
    password: '',
    confirmPassword: ''
  });
  
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('personalInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) clearError();
  };

  // Step 1: Phone & Email
  const validatePhoneEmail = () => {
    const errors = {};
    
    if (!formData.phoneNumber.match(/^[0-9]{10}$/)) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhoneEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validatePhoneEmail()) return;
    
    try {
      console.log('Attempting registration with:', { phoneNumber: formData.phoneNumber, email: formData.email });
      const response = await initiateRegistration(
        formData.phoneNumber,
        formData.email,
        formData.countryCode
      );
      
      console.log('Registration response:', response);
      
      // Response structure: { success, message, sessionId, otpSent, otp? }
      if (response && response.sessionId) {
        setSessionId(response.sessionId);
        if (response.otp) {
          setDevOTP(response.otp); // Development only
          console.log('🔐 OTP for Testing:', response.otp);
          console.log('Session ID:', response.sessionId);
        }
        setCurrentStep(STEPS.OTP_VERIFICATION);
      } else {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Initiation failed:', err);
      console.error('Error details:', err.message, err.response);
    }
  };

  // Step 2: OTP Verification
  const validateOTP = () => {
    const errors = {};
    
    if (!formData.otp || formData.otp.length !== 6) {
      errors.otp = 'Please enter the 6-digit OTP';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    if (!validateOTP()) return;
    
    try {
      // Verify OTP with backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp: formData.otp })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'OTP verification failed');
      }
      
      // OTP verified successfully, proceed to role selection
      clearError();
      setCurrentStep(STEPS.ROLE_SELECTION);
    } catch (err) {
      console.error('OTP verification failed:', err);
      setValidationErrors({ otp: err.message || 'Invalid OTP. Please try again.' });
    }
  };

  // Step 3: Role Selection
  const handleRoleSelect = (role) => {
    setFormData(prev => ({ ...prev, role }));
    setCurrentStep(STEPS.PERSONAL_INFO);
  };

  // Step 4: Personal Info
  const validatePersonalInfo = () => {
    const errors = {};
    const { personalInfo } = formData;
    
    if (!personalInfo.firstName.trim()) {
      errors['personalInfo.firstName'] = 'First name is required';
    }
    
    if (!personalInfo.lastName.trim()) {
      errors['personalInfo.lastName'] = 'Last name is required';
    }
    
    if (!personalInfo.dateOfBirth) {
      errors['personalInfo.dateOfBirth'] = 'Date of birth is required';
    } else {
      const age = Math.floor((new Date() - new Date(personalInfo.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        errors['personalInfo.dateOfBirth'] = 'You must be at least 18 years old';
      }
    }
    
    if (!personalInfo.gender) {
      errors['personalInfo.gender'] = 'Gender is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePersonalInfoSubmit = (e) => {
    e.preventDefault();
    if (!validatePersonalInfo()) return;
    setCurrentStep(STEPS.PASSWORD);
  };

  // Step 5: Password
  const validatePassword = () => {
    const errors = {};
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(formData.password)) {
      errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    
    try {
      await completeRegistration(
        sessionId,
        formData.otp,
        formData.role,
        formData.personalInfo,
        formData.password
      );
      
      setCurrentStep(STEPS.SUCCESS);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      const response = await initiateRegistration(
        formData.phoneNumber,
        formData.email,
        formData.countryCode
      );
      
      if (response && response.sessionId) {
        setSessionId(response.sessionId);
        if (response.otp) setDevOTP(response.otp);
      }
    } catch (err) {
      console.error('Resend OTP failed:', err);
    }
  };

  // Step Renderer
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.PHONE_EMAIL:
        return <PhoneEmailStep formData={formData} handleChange={handleChange} handleSubmit={handlePhoneEmailSubmit} validationErrors={validationErrors} isLoading={isLoading} error={error} />;
      
      case STEPS.OTP_VERIFICATION:
        return <OTPStep formData={formData} handleChange={handleChange} handleSubmit={handleOTPSubmit} validationErrors={validationErrors} isLoading={isLoading} error={error} devOTP={devOTP} onResend={handleResendOTP} />;
      
      case STEPS.ROLE_SELECTION:
        return <RoleSelectionStep handleRoleSelect={handleRoleSelect} />;
      
      case STEPS.PERSONAL_INFO:
        return <PersonalInfoStep formData={formData} handleChange={handleChange} handleSubmit={handlePersonalInfoSubmit} validationErrors={validationErrors} />;
      
      case STEPS.PASSWORD:
        return <PasswordStep formData={formData} handleChange={handleChange} handleSubmit={handlePasswordSubmit} validationErrors={validationErrors} isLoading={isLoading} error={error} />;
      
      case STEPS.SUCCESS:
        return <SuccessStep navigate={navigate} role={formData.role} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-md w-full">
        {/* Progress Bar */}
        {currentStep < STEPS.SUCCESS && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 mx-1 rounded-full transition ${
                    step <= currentStep ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600 text-center">Step {currentStep} of 5</p>
          </div>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
};

// Step Components

const PhoneEmailStep = ({ formData, handleChange, handleSubmit, validationErrors, isLoading, error }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
      <p className="text-gray-600 mt-2">Let's get started with your phone and email</p>
    </div>

    {error && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <div className="flex gap-2">
          <select
            name="countryCode"
            value={formData.countryCode}
            onChange={handleChange}
            className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            <option value="+91">+91</option>
            <option value="+1">+1</option>
          </select>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="10-digit phone number"
            disabled={isLoading}
          />
        </div>
        {validationErrors.phoneNumber && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
            validationErrors.email ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="your@email.com"
          disabled={isLoading}
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Sending OTP...' : 'Continue'}
      </button>
    </form>

    <p className="mt-6 text-center text-sm text-gray-600">
      Already have an account?{' '}
      <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
        Sign In
      </Link>
    </p>
  </div>
);

const OTPStep = ({ formData, handleChange, handleSubmit, validationErrors, devOTP, onResend }) => {
  const [resendCountdown, setResendCountdown] = useState(0);
  
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);
  
  const handleResend = async () => {
    setResendCountdown(60);
    await onResend();
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
        <p className="text-gray-600 mt-2">Enter the 6-digit code sent to your phone</p>
        {devOTP && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Dev Mode:</strong> Your OTP is <strong className="font-mono text-lg">{devOTP}</strong>
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          name="otp"
          value={formData.otp}
          onChange={handleChange}
          maxLength={6}
          className={`w-full px-4 py-3 border rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 ${
            validationErrors.otp ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="000000"
        />
        {validationErrors.otp && (
          <p className="mt-1 text-sm text-red-600 text-center">{validationErrors.otp}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
      >
        Verify & Continue
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={resendCountdown > 0}
        className="w-full text-indigo-600 hover:text-indigo-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
      </button>
    </form>
  </div>
  );
};

const RoleSelectionStep = ({ handleRoleSelect }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold text-gray-900">Choose Your Role</h2>
      <p className="text-gray-600 mt-2">Select how you'll be using CareQueue</p>
    </div>

    <div className="space-y-4">
      <button
        onClick={() => handleRoleSelect('patient')}
        className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200">
            <svg className="w-6 h-6 text-blue-600 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Patient</h3>
            <p className="text-sm text-gray-600">Book appointments and manage health records</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => handleRoleSelect('doctor')}
        className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition text-left group"
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200">
            <svg className="w-6 h-6 text-green-600 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">Doctor</h3>
            <p className="text-sm text-gray-600">Manage patients and appointments</p>
          </div>
        </div>
      </button>
    </div>
  </div>
);

const PersonalInfoStep = ({ formData, handleChange, handleSubmit, validationErrors }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
      <p className="text-gray-600 mt-2">Tell us a bit about yourself</p>
    </div>

    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
          <input
            type="text"
            name="personalInfo.firstName"
            value={formData.personalInfo.firstName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              validationErrors['personalInfo.firstName'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors['personalInfo.firstName'] && (
            <p className="mt-1 text-sm text-red-600">{validationErrors['personalInfo.firstName']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
          <input
            type="text"
            name="personalInfo.lastName"
            value={formData.personalInfo.lastName}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
              validationErrors['personalInfo.lastName'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors['personalInfo.lastName'] && (
            <p className="mt-1 text-sm text-red-600">{validationErrors['personalInfo.lastName']}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
        <input
          type="date"
          name="personalInfo.dateOfBirth"
          value={formData.personalInfo.dateOfBirth}
          onChange={handleChange}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
            validationErrors['personalInfo.dateOfBirth'] ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {validationErrors['personalInfo.dateOfBirth'] && (
          <p className="mt-1 text-sm text-red-600">{validationErrors['personalInfo.dateOfBirth']}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
        <select
          name="personalInfo.gender"
          value={formData.personalInfo.gender}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
            validationErrors['personalInfo.gender'] ? 'border-red-300' : 'border-gray-300'
          }`}
        >
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        {validationErrors['personalInfo.gender'] && (
          <p className="mt-1 text-sm text-red-600">{validationErrors['personalInfo.gender']}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
      >
        Continue
      </button>
    </form>
  </div>
);

const PasswordStep = ({ formData, handleChange, handleSubmit, validationErrors, isLoading, error }) => (
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <div className="text-center mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Create Password</h2>
      <p className="text-gray-600 mt-2">Choose a strong password for your account</p>
    </div>

    {error && (
      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
        {error}
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
            validationErrors.password ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter password"
        />
        {validationErrors.password && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Must contain: 8+ characters, uppercase, lowercase, number, special character
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
            validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Re-enter password"
        />
        {validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading ? 'Creating Account...' : 'Complete Registration'}
      </button>
    </form>
  </div>
);

const SuccessStep = ({ navigate, role }) => {
  const handleContinue = () => {
    if (role === 'patient') {
      navigate('/patient/dashboard');
    } else if (role === 'doctor') {
      navigate('/doctor/dashboard');
    } else {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CareQueue!</h2>
      <p className="text-gray-600 mb-8">
        Your account has been created successfully. You're all set to get started.
      </p>

      <button
        onClick={handleContinue}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700"
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default Register;
