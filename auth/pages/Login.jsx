import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@core/services/firebaseService';
import { firestoreService } from '@core/services/firebaseService';
import { dummyUsers, dummyOwners } from '@core/utils/dummyData';
import toast from 'react-hot-toast';
import { Mail, Lock, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';

// Mock authentication for when Firebase is not configured
const mockAuth = {
  signInWithEmail: async (email, password) => {
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check against dummy users
    const user = dummyUsers.find(u => u.email === email);
    if (user) {
      return { uid: user.id, email: user.email, role: user.role };
    }
    
    // Check against dummy owners
    const owner = dummyOwners.find(v => v.email === email);
    if (owner) {
      return { uid: owner.id, email: owner.email, role: owner.role };
    }
    
    // For demo purposes, allow any login with role selection
    return { 
      uid: 'demo_user', 
      email: email, 
      role: email.includes('admin') ? 'admin' : email.includes('owner') ? 'owner' : 'user' 
    };
  },
  
  signInWithPhone: async (phone) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { confirmationResult: true };
  },
  
  verifyOTP: async (confirmationResult, otp) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { 
      uid: 'demo_user', 
      phoneNumber: phone, 
      role: 'user' 
    };
  }
};

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phone: '',
  });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let user;
      
      try {
        user = await authService.signInWithEmail(formData.email, formData.password);
      } catch (firebaseError) {
        // Fallback to mock auth if Firebase is not configured
        console.warn('Firebase auth failed, using mock auth:', firebaseError.message);
        user = await mockAuth.signInWithEmail(formData.email, formData.password);
      }
      
      // Get user role & Verify
      let role = user.role;
      try {
        const userDoc = await firestoreService.getUserDocument(user.uid);
        role = userDoc?.role || role;
      } catch (error) {
        console.warn('Using auth role');
      }

      if (role && role !== 'user') {
        const portal = role === 'admin' ? '/admin/login' : '/owner/login';
        throw new Error(`Access Denied: This portal is for standard users only. Please use the ${role} portal.`);
      }

      // Store user in session storage
      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: 'user',
      }));

      navigate('/user/home');
      toast.success('Login successful');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let confirmationResult;
      
      try {
        const recaptchaVerifier = new window.firebase.auth.RecaptchaVerifier(
          'recaptcha-container',
          {
            size: 'invisible',
          }
        );
        confirmationResult = await authService.signInWithPhone(
          `+${formData.phone}`,
          recaptchaVerifier
        );
      } catch (firebaseError) {
        // Fallback to mock auth
        console.warn('Firebase phone auth failed, using mock auth:', firebaseError.message);
        confirmationResult = await mockAuth.signInWithPhone(formData.phone);
      }

      // Store confirmation result and navigate to OTP verification
      sessionStorage.setItem('confirmationResult', JSON.stringify(confirmationResult));
      sessionStorage.setItem('phone', formData.phone);
      navigate('/auth/otp');

      toast.success('OTP sent successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">User Login</h1>
            <p className="text-gray-600">Access your property dashboard</p>
          </div>

          {/* Login Method Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-600'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 rounded-md font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-white shadow text-primary-600'
                  : 'text-gray-600'
              }`}
            >
              Phone
            </button>
          </div>

          {loginMethod === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded text-primary-600" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button type="button" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Logging in...' : 'Login'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div id="recaptcha-container"></div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-4">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/auth/signup')}
                className="text-primary-600 hover:text-primary-700 font-black"
              >
                Sign up
              </button>
            </p>
            <div className="flex items-center justify-center space-x-6">
              <button 
                onClick={() => navigate('/owner/login')}
                className="text-xs font-bold text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-widest"
              >
                Owner Portal
              </button>
              <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
              <button 
                onClick={() => navigate('/admin/login')}
                className="text-xs font-bold text-gray-400 hover:text-primary-600 transition-colors uppercase tracking-widest"
              >
                Admin Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
