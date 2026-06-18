import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService, firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, Chrome as Google, Facebook } from 'lucide-react';

export default function UserAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { from, product } = location.state || {};
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 600);
    return () => clearTimeout(timer);
  }, [isLogin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await authService.signInWithEmail(formData.email, formData.password);
      const userDoc = await firestoreService.getUserDocument(user.uid);
      const role = userDoc?.role || 'user';

      if (role !== 'user') {
        throw new Error(`Please use the ${role} portal to login.`);
      }

      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: 'user',
        displayName: userDoc?.displayName || userDoc?.name || user.displayName || 'User',
        photoURL: userDoc?.photoURL || user.photoURL || null
      }));

      if (from) {
        navigate(from, { state: { product }, replace: true });
      } else {
        navigate('/user/home');
      }
      toast.success('Welcome back!');
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password.');
        toast.error('Invalid email or password.');
      } else {
        setErrorMsg(error.message || 'Login failed');
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await authService.signUpWithEmail(formData.email, formData.password);
      await firestoreService.createUserDocument(user.uid, {
        name: formData.name,
        email: formData.email,
        role: 'user',
        createdAt: new Date().toISOString(),
      });

      await authService.silentLogout();
      
      setIsLogin(true);
      setFormData({ name: '', email: '', password: '' });
      toast.success('Account created successfully! Please log in.');
    } catch (error) {
      setErrorMsg(error.message || 'Signup failed');
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAuth = () => {
    setIsLogin(!isLogin);
    setFormData({ name: '', email: '', password: '' });
    setErrorMsg('');
  };

  return (
    <div className="h-screen bg-[#6366f1] flex flex-col items-center justify-center p-3 sm:p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#a855f7] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ec4899] rounded-full blur-[120px] opacity-40 animate-pulse"></div>

      {/* Card: flex-col on mobile (image top, form bottom), flex-row on desktop */}
      <div className="max-w-4xl w-full flex-1 md:flex-none bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 md:min-h-[520px] transition-all duration-700">
        
        {/* ── IMAGE ── top on mobile (30% height), left/right on desktop */}
        <div className={`w-full md:w-1/2 relative flex-shrink-0 h-[30%] md:h-auto transition-all duration-700 ${isLogin ? 'md:order-1' : 'md:order-2'} overflow-hidden`}>
          {/* Login Image */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${isLogin ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src="/luxury_apartment_login_1777897807189.png" className="absolute inset-0 w-full h-full object-cover" alt="Login" />
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-black/10 to-transparent flex flex-col justify-end p-5 md:p-8 text-white">
              <h2 className="text-base sm:text-xl md:text-2xl font-black mb-0.5 tracking-tight">Premium Properties</h2>
              <p className="text-white/70 text-[11px] font-semibold hidden sm:block leading-relaxed max-w-[250px]">Access the best deals in luxury real estate worldwide.</p>
            </div>
          </div>
          {/* Signup Image */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${!isLogin ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src="/happy_homeowner_signup_1777897822974.png" className="absolute inset-0 w-full h-full object-cover" alt="Signup" />
            <div className="absolute inset-0 bg-gradient-to-t from-pink-950/80 via-black/10 to-transparent flex flex-col justify-end p-5 md:p-8 text-white">
              <h2 className="text-base sm:text-xl md:text-2xl font-black mb-0.5 tracking-tight">Your New Journey</h2>
              <p className="text-white/70 text-[11px] font-semibold hidden sm:block leading-relaxed max-w-[250px]">Join our community of happy homeowners today.</p>
            </div>
          </div>
        </div>

        {/* ── FORM ── bottom on mobile (fills remaining 70%), right/left on desktop */}
        <div className={`w-full md:w-1/2 flex-1 overflow-hidden p-2 sm:p-5 md:p-10 flex flex-col justify-start pt-3 md:justify-center transition-all duration-700 ${isLogin ? 'md:order-2' : 'md:order-1'} ${animate ? 'animate-auth-fade' : ''}`}>
          <div className="mb-2 md:mb-6">
            <h1 className="text-lg md:text-3xl font-black text-gray-800 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-gray-400 text-[11px] md:text-sm font-bold mt-0.5">
              {isLogin ? 'Login in to your account' : 'Join our real estate platform'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-semibold rounded-r">
              {errorMsg}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-1.5">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
                  <input type="text" required value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-sm"
                    placeholder="John Doe" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
                <input type="email" required value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-11 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-sm"
                  placeholder="name@example.com" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                {isLogin && <button type="button" className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter hover:underline">Forgot?</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
                <input type={showPassword ? 'text' : 'password'} required value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-11 pr-11 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none font-bold text-gray-700 transition-all text-sm"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-indigo-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[0.99] transition-all active:scale-[0.97] disabled:opacity-50">
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-1">
            {/* OR CONTINUE WITH — hidden on small mobile to save space */}
            <div className="hidden sm:block">
              <div className="relative mb-1.5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.2em] text-gray-300">
                  <span className="bg-white px-3">Or continue with</span>
                </div>
              </div>
              <div className="flex justify-center gap-3 mb-2">
                <button className="p-2 bg-white border border-gray-100 rounded-full shadow-sm hover:scale-110 transition-all hover:bg-gray-50"><Google className="w-4 h-4 text-red-500" /></button>
                <button className="p-2 bg-white border border-gray-100 rounded-full shadow-sm hover:scale-110 transition-all hover:bg-gray-50"><Facebook className="w-4 h-4 text-blue-600" /></button>
              </div>
            </div>
            {/* Toggle — always visible */}
            <p className="mt-1.5 text-center text-xs font-bold text-gray-400">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button onClick={toggleAuth} className="text-indigo-600 hover:underline ml-1 font-black">
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes authFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-auth-fade {
          animation: authFade 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}} />
    </div>
  );
}
