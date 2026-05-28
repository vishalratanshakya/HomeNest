import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService, firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';

// Mock authentication for when Firebase is not configured
const mockAuth = {
  signUpWithEmail: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { uid: `user_${Date.now()}`, email: email };
  },
  
  signInWithPhone: async (phone) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { confirmationResult: true };
  },
  
  verifyOTP: async (confirmationResult, otp) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { uid: `user_${Date.now()}`, phoneNumber: sessionStorage.getItem('phone') };
  }
};

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'user', // 'user', 'vendor', 'admin'
  });
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('email'); // 'email' or 'phone'
  const [showOTP, setShowOTP] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otp, setOtp] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const { phone: initialPhone } = location.state || {};

  if (initialPhone) {
    formData.phone = initialPhone.replace('+', '');
    setMethod('phone');
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let user;
      
      try {
        user = await authService.signUpWithEmail(formData.email, formData.password);
      } catch (firebaseError) {
        // Fallback to mock auth if Firebase is not configured
        console.warn('Firebase signup failed, using mock auth:', firebaseError.message);
        user = await mockAuth.signUpWithEmail(formData.email, formData.password);
      }

      // Default to 'user' role for this signup page
      const role = 'user';

      // Try to create user document in Firestore
      try {
        await firestoreService.createUserDocument(user.uid, {
          name: formData.name,
          email: formData.email,
          role: role,
          phone: formData.phone ? `+${formData.phone}` : null,
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError) {
        console.warn('Could not create user in Firestore');
      }

      // Store user in session storage
      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: role,
        name: formData.name,
      }));

      navigate('/user/home');
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      try {
        const recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(
          'recaptcha-container',
          {
            size: 'invisible',
          }
        );
        result = await authService.signInWithPhone(
          `+${formData.phone}`,
          recaptchaVerifier
        );
      } catch (firebaseError) {
        // Fallback to mock auth
        console.warn('Firebase phone auth failed, using mock auth:', firebaseError.message);
        result = await mockAuth.signInWithPhone(formData.phone);
      }

      setConfirmationResult(result);
      setShowOTP(true);
      sessionStorage.setItem('phone', formData.phone);
      toast.success('OTP sent successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let user;
      
      try {
        user = await authService.verifyOTP(confirmationResult, otp);
      } catch (firebaseError) {
        // Fallback to mock auth
        console.warn('Firebase OTP verification failed, using mock auth:', firebaseError.message);
        user = await mockAuth.verifyOTP(null, otp);
      }

      // Default to 'user' role
      const role = 'user';

      // Try to create user document in Firestore
      try {
        await firestoreService.createUserDocument(user.uid, {
          name: formData.name,
          email: user.email || null,
          role: role,
          phone: `+${formData.phone}`,
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError) {
        console.warn('Could not create user in Firestore');
      }

      // Store user in session storage
      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email || user.phoneNumber,
        role: role,
        name: formData.name,
      }));

      navigate('/user/home');
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join HomeNest Marketplace today</p>
          <p className="text-xs text-gray-500 mt-2">Demo mode: Account created in session storage only</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMethod('email')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              method === 'email'
                ? 'bg-white shadow text-primary-600 font-medium'
                : 'text-gray-600'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setMethod('phone')}
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              method === 'phone'
                ? 'bg-white shadow text-primary-600 font-medium'
                : 'text-gray-600'
            }`}
          >
            Phone
          </button>
        </div>

        {!showOTP ? (
          <form onSubmit={method === 'email' ? handleEmailSignup : handlePhoneSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            {method === 'email' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            {method === 'phone' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="919876543210"
                />
              </div>
            )}



            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? method === 'email'
                  ? 'Creating account...'
                  : 'Sending OTP...'
                : method === 'email'
                  ? 'Create Account'
                  : 'Send OTP'}
            </button>

            <div id="recaptcha-container"></div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/auth/login')}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
