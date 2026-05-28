// Vendor Authentication Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, Store, ArrowRight, Building, MapPin, Briefcase } from 'lucide-react';

export default function VendorAuth() {
  const navigate = useNavigate();
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
      let userDoc = await firestoreService.getUserDocument(user.uid);
      
      // If user doc doesn't exist, create it (handles edge cases like social login or missing docs)
      if (!userDoc) {
        await firestoreService.createUserDocument(user.uid, {
          name: user.displayName || formData.email.split('@')[0],
          email: user.email,
          role: 'vendor',
          createdAt: new Date().toISOString(), // Keeping consistent with current schema
        });
        userDoc = { role: 'vendor' };
      }

      const role = userDoc?.role || 'vendor';

      if (role !== 'vendor' && role !== 'agent') {
        throw new Error(`Please use the ${role} portal to login.`);
      }

      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: 'vendor',
        displayName: userDoc?.displayName || userDoc?.name || user.displayName || 'Vendor',
        photoURL: userDoc?.photoURL || user.photoURL || null
      }));

      navigate('/vendor/dashboard');
      toast.success('Vendor Dashboard access granted');
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
        role: 'vendor',
        createdAt: new Date().toISOString(),
      });

      await authService.silentLogout();

      setIsLogin(true);
      setFormData({ name: '', email: '', password: '' });
      toast.success('Vendor account created! Please log in.');
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
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Premium Dark Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-600/20 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="max-w-5xl w-full bg-[#1e293b]/80 backdrop-blur-2xl border border-slate-700/50 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px] transition-all duration-700">
        
        {/* Decorative Side Panel */}
        <div className={`w-full md:w-5/12 bg-gradient-to-br from-slate-800 to-slate-900 p-10 flex flex-col justify-between relative overflow-hidden transition-all duration-700 border-r border-slate-700/50 ${isLogin ? 'md:order-1' : 'md:order-2'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Store className="w-64 h-64 text-amber-500 transform rotate-12" />
          </div>
          
          <div className="relative z-10">
              <div className="flex items-center gap-3 mb-16">
                <img 
                  src="/homenest-logo.jpg" 
                  alt="HomeNest Logo" 
                  className="h-10 w-auto object-contain rounded-lg"
                />
              </div>

            <div className={`transition-all duration-500 ${animate ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
              <h2 className="text-3xl font-black text-white mb-4 leading-tight">
                {isLogin ? 'Empower Your Real Estate Business' : 'Join the Elite Vendor Network'}
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                {isLogin 
                  ? 'Access your dashboard to manage properties, track leads, and close deals faster with our advanced analytics.' 
                  : 'Scale your property business with our premium tools, dedicated support, and access to thousands of verified buyers.'}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium">Manage your entire portfolio</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <MapPin className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-sm font-medium">Reach global premium buyers</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-700"></div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-slate-600"></div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-800 bg-amber-500 flex items-center justify-center text-xs font-bold text-white">+2k</div>
              </div>
              <p className="text-xs text-slate-400 font-medium">Trusted by top agencies</p>
            </div>
          </div>
        </div>

        {/* Form Panel */}
        <div className={`w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center transition-all duration-700 ${isLogin ? 'md:order-2' : 'md:order-1'} ${animate ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">
              {isLogin ? 'Vendor Portal' : 'Create Agency Account'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin ? 'Enter your credentials to access your dashboard' : 'Fill in the details below to get started'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-900/30 border-l-4 border-red-500 text-red-400 text-sm font-semibold rounded-r">
              {errorMsg}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agency Name</label>
                <div className="relative group">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 focus:bg-slate-800 outline-none font-medium text-white transition-all text-sm"
                    placeholder="Premium Estates LLC"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 focus:bg-slate-800 outline-none font-medium text-white transition-all text-sm"
                  placeholder="contact@agency.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
                {isLogin && <button type="button" className="text-xs font-bold text-amber-500 hover:text-amber-400 hover:underline transition-colors">Forgot?</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-amber-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 focus:bg-slate-800 outline-none font-medium text-white transition-all text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-900/50 hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <>
                  {isLogin ? 'Access Dashboard' : 'Register Agency'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-sm font-medium text-slate-400">
              {isLogin ? "New to the platform?" : "Already registered?"}{' '}
              <button 
                onClick={toggleAuth} 
                className="text-amber-500 font-bold hover:text-amber-400 hover:underline transition-colors ml-1"
              >
                {isLogin ? 'Apply as Vendor' : 'Sign in here'}
              </button>
            </p>
            
            {isLogin && (
              <button 
                onClick={() => navigate('/auth/login')}
                className="mt-8 text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors flex items-center justify-center gap-1 mx-auto"
              >
               
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
