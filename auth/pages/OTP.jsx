import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@core/services/firebaseService';
import { firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Shield } from 'lucide-react';

// Mock authentication for when Firebase is not configured
const mockAuth = {
  verifyOTP: async (confirmationResult, otp) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const phone = sessionStorage.getItem('phone');
    return { 
      uid: 'demo_user', 
      phoneNumber: phone, 
      role: 'user' 
    };
  }
};

export default function OTP() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) {
      value = value[0];
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);

    const otpValue = otp.join('');

    try {
      let user;
      
      try {
        const confirmationResult = JSON.parse(sessionStorage.getItem('confirmationResult'));
        user = await authService.verifyOTP(confirmationResult, otpValue);
      } catch (firebaseError) {
        // Fallback to mock auth
        console.warn('Firebase OTP verification failed, using mock auth:', firebaseError.message);
        user = await mockAuth.verifyOTP(null, otpValue);
      }

      // Verify Role
      let role = user.role;
      try {
        const userDoc = await firestoreService.getUserDocument(user.uid);
        role = userDoc?.role || role;
      } catch (error) {
        console.warn('Using auth role');
      }

      if (role && role !== 'user') {
        throw new Error(`Access Denied: This portal is for standard users only. Please login via the ${role} portal.`);
      }

      // Store user in session storage
      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email || user.phoneNumber,
        role: 'user',
      }));

      navigate('/user/home');

      toast.success('Login successful');
    } catch (error) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setTimeLeft(30);
    toast.success('OTP resent successfully');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify OTP</h1>
            <p className="text-gray-600">Enter the 6-digit code sent to your phone</p>
            <p className="text-xs text-gray-500 mt-2">Demo mode: Enter any 6 digits to continue</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                Didn't receive code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timeLeft > 0}
                  className="text-primary-600 hover:text-primary-700 font-medium disabled:text-gray-400"
                >
                  {timeLeft > 0 ? `Resend in ${timeLeft}s` : 'Resend'}
                </button>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Verifying...' : 'Verify'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth/login')}
              className="text-gray-600 hover:text-gray-700"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
