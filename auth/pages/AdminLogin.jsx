import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Eye, EyeOff, ShieldCheck, ChevronRight } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'signup'
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Firebase Auth login or signup
      let user;
      if (activeTab === 'signup') {
        user = await authService.signUpWithEmail(formData.email, formData.password);
      } else {
        user = await authService.signInWithEmail(formData.email, formData.password);
      }

      // Step 2: Fetch Firestore document
      let userDoc = await firestoreService.getUserDocument(user.uid);

      // Step 3: If no document exists → first-time admin setup, create it
      if (!userDoc) {
        await firestoreService.createAdminDocument(user.uid, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Admin',
          role: 'admin',
        });
        userDoc = { role: 'admin' };
      }

      // Step 4: Role check
      const role = userDoc?.role;
      if (role !== 'admin') {
        await authService.logout();
        throw new Error('Access Denied: This account does not have admin privileges.');
      }

      // Step 5: Store session and navigate
      sessionStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        role: 'admin',
        displayName: userDoc?.displayName || userDoc?.name || user.displayName || 'Admin',
        photoURL: userDoc?.photoURL || user.photoURL || null
      }));

      toast.success('Admin authentication successful');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4a1033] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Shapes in background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[120%] bg-[#b03060] rotate-12 skew-x-12 blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[120%] bg-[#800020] -rotate-12 -skew-x-12 blur-3xl"></div>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-10 min-h-[600px]">
        
        {/* Left Tabs Sidebar */}
        <div className="w-full md:w-1/3 bg-gradient-to-br from-[#800020] to-[#b03060] p-8 flex flex-col justify-center gap-4">
          <button
            onClick={() => setActiveTab('login')}
            className={`w-full py-4 px-8 rounded-full text-left font-black uppercase tracking-widest transition-all flex items-center justify-between ${
              activeTab === 'login' 
                ? 'bg-white text-[#800020] shadow-xl translate-x-4' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Login
            {activeTab === 'login' && <ChevronRight className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`w-full py-4 px-8 rounded-full text-left font-black uppercase tracking-widest transition-all flex items-center justify-between ${
              activeTab === 'signup' 
                ? 'bg-white text-[#800020] shadow-xl translate-x-4' 
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Sign Up
            {activeTab === 'signup' && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Right Form Area */}
        <div className="flex-1 p-12 bg-white flex flex-col justify-center">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#800020] to-[#b03060] rounded-full flex items-center justify-center mb-4 shadow-lg border-4 border-gray-50">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-[#800020] uppercase tracking-tighter">
              {activeTab === 'login' ? 'Login' : 'Sign Up'}
            </h1>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-8 max-w-sm mx-auto w-full">
            <div className="space-y-1 group">
              <div className="flex items-center space-x-3 text-gray-400 group-focus-within:text-[#b03060] transition-colors mb-2">
                <User className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Admin Email</span>
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full pb-4 bg-transparent border-b-2 border-gray-100 focus:border-[#b03060] outline-none font-bold text-gray-700 text-lg transition-all"
                placeholder="admin@homenest.com"
              />
            </div>

            <div className="space-y-1 group">
              <div className="flex items-center space-x-3 text-gray-400 group-focus-within:text-[#b03060] transition-colors mb-2">
                <Lock className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Password</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className="w-full pb-4 bg-transparent border-b-2 border-gray-100 focus:border-[#b03060] outline-none font-bold text-gray-700 text-lg transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 text-gray-400 hover:text-[#b03060]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button type="button" className="text-xs font-bold text-gray-400 hover:text-[#b03060] underline underline-offset-4">Forgot Password?</button>
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-3 bg-gradient-to-r from-[#800020] to-[#b03060] text-white rounded-full font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50"
              >
                {loading ? 'Wait...' : activeTab === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </div>
          </form>

          <div className="mt-16 text-center">
             <button 
                onClick={() => navigate('/auth/login')}
                className="text-xs font-black text-gray-300 hover:text-[#b03060] uppercase tracking-widest transition-colors"
              >
             
              </button>
          </div>
        </div>

      </div>
    </div>
  );
}
