import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const inputRefs = useRef([]);

  // Get session data from location state
  const sessionId = location.state?.sessionId;
  const phoneNumber = location.state?.phoneNumber;
  const email = location.state?.email;
  const purpose = location.state?.purpose || 'registration'; // 'registration' or 'password-reset'

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) {
      navigate('/register');
    }
  }, [sessionId, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Format timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle OTP input
  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  // Verify OTP
  const handleVerify = async (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-otp', {
        sessionId,
        otp: otpCode
      });

      // Note: api.interceptors unwraps response.data automatically
      if (response.success) {
        setSuccess('OTP verified successfully!');
        
        // Redirect based on purpose
        setTimeout(() => {
          if (purpose === 'password-reset') {
            navigate('/reset-password', { 
              state: { 
                sessionId, 
                otp: otpCode,
                verified: true 
              } 
            });
          } else {
            navigate('/register', { 
              state: { 
                sessionId, 
                otp: otpCode, 
                verified: true,
                phoneNumber,
                email
              } 
            });
          }
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      let endpoint, payload;
      
      if (purpose === 'password-reset') {
        endpoint = '/auth/forgot-password';
        payload = { phoneOrEmail: email || phoneNumber };
      } else {
        endpoint = '/auth/register/initiate';
        payload = { phoneNumber, email };
      }

      const response = await api.post(endpoint, payload);

      // Note: api.interceptors unwraps response.data automatically
      if (response.success) {
        setSuccess('New OTP sent successfully!');
        setTimer(300); // Reset timer
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Update sessionId if provided
        if (response.sessionId) {
          navigate('/verify-otp', {
            state: {
              sessionId: response.sessionId,
              phoneNumber,
              email,
              purpose
            },
            replace: true
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h2>
          <p className="text-gray-600">
            Enter the 6-digit code sent to
            <br />
            <span className="font-semibold text-gray-800">
              {phoneNumber || email}
            </span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loading}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              {timer > 0 ? (
                <>
                  Time remaining: <span className="font-semibold text-blue-600">{formatTime(timer)}</span>
                </>
              ) : (
                <span className="text-red-600 font-semibold">OTP expired</span>
              )}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-start">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || otp.some(d => !d)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </button>
        </div>

        {/* Resend OTP */}
        <div className="text-center space-y-4">
          <button
            onClick={handleResend}
            disabled={resending || timer > 0}
            className="text-blue-600 hover:text-blue-700 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>

          <div className="pt-4 border-t border-gray-200">
            <Link
              to={purpose === 'password-reset' ? '/login' : '/register'}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Back to {purpose === 'password-reset' ? 'login' : 'registration'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;


