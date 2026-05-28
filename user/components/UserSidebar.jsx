import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService, firestoreService } from "@core/services/firebaseService";
import { 
  User, 
  Heart, 
  Calendar, 
  MessageSquare, 
  Settings, 
  LogOut, 
  CreditCard,
  Home,
  Search,
  Clock,
  CheckCircle2,
  X,
  MapPin,
  ShoppingBag,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const UserSidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(location.pathname.startsWith('/user/tracking'));

  useEffect(() => {
    let unsubDoc = () => {};
    const unsubAuth = authService.onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Real-time subscription — updates sidebar instantly when profile changes
        unsubDoc = firestoreService.subscribeToUserDocument(firebaseUser.uid, (doc) => {
          setUserDoc(doc);
        });
      } else {
        setUserDoc(null);
        unsubDoc();
      }
    });

    // Also listen for the manual dispatch from EditProfile.jsx
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setUser(prev => prev ? { ...prev, displayName: e.detail.displayName, photoURL: e.detail.photoURL } : prev);
        setUserDoc(prev => prev ? { ...prev, ...e.detail } : e.detail);
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);

    return () => {
      unsubAuth();
      unsubDoc();
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  // Best-effort display name: Firestore doc > Firebase Auth > email prefix
  const displayName = userDoc?.fullName || userDoc?.displayName || userDoc?.name || user?.displayName || user?.email?.split('@')[0] || 'Member';
  const photoURL = userDoc?.photoURL || user?.photoURL || null;
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';


  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const menuItems = [
    { label: 'My Profile', path: '/user/profile', icon: User },
    { label: 'Buy Property', path: '/user/sale', icon: ShoppingBag },
    { 
      label: 'Order Tracking Status', 
      icon: Clock, 
      isCollapsible: true,
      children: [
        { label: 'Buy Property Tracking', path: '/user/tracking/buy' },
        { label: 'Book Property Tracking', path: '/user/tracking/book' }
      ]
    },
    { label: 'My Bookings', path: '/user/bookings', icon: Calendar },
    { label: 'Property Visits', path: '/user/property-visits', icon: MapPin },
    { label: 'Messages', path: '/user/messages', icon: MessageSquare },
    { label: 'Wishlist', path: '/user/saved-properties', icon: Heart },
    { label: 'Transactions', path: '/user/transactions', icon: CreditCard },
    { label: 'Settings', path: '/user/settings', icon: Settings },
  ];

  const sidebarContent = (
    <aside className={`
      w-60 h-screen bg-gradient-to-b from-[#2563eb] via-[#1e40af] to-[#1e3a8a] text-white flex flex-col shadow-2xl
      ${isOpen ? 'fixed left-0 top-0 z-[100]' : 'hidden lg:flex fixed left-0 top-0 z-50'}
    `}>
      {/* Header Section with Close for Mobile */}
      <div className="p-8 flex items-center justify-between group">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/user/home')}
        >
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/20 transition-transform group-hover:scale-105">
            <Home className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-none">HomeNest</span>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1">User Portal</span>
          </div>
        </div>
        
        {isOpen && (
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          if (item.isCollapsible) {
            const isSubActive = location.pathname.startsWith('/user/tracking');
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => setIsTrackingOpen(!isTrackingOpen)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-white/60 hover:bg-white/5 hover:text-white
                    ${isSubActive ? 'bg-white/10 text-white shadow-md' : ''}
                  `}
                >
                  <div className="w-6 h-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <item.icon size={20} />
                  </div>
                  <span className="text-sm font-bold tracking-wide">{item.label}</span>
                  <ChevronRight size={16} className={`ml-auto transition-transform duration-300 ${isTrackingOpen ? 'rotate-90 text-white' : 'text-white/40'}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isTrackingOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pl-12 space-y-1 overflow-hidden"
                    >
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setIsOpen(false)}
                          className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-xs font-bold
                            ${isActive 
                              ? 'bg-white/20 text-white' 
                              : 'text-white/50 hover:bg-white/5 hover:text-white'}
                          `}
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
                ${isActive 
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-md border border-white/10' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'}
              `}
            >
              <div className="w-6 h-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <item.icon size={20} />
              </div>
              <span className="text-sm font-bold tracking-wide">{item.label}</span>
              <div className={`ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-40 transition-opacity ${location.pathname === item.path ? 'opacity-100' : ''}`} />
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-6">
        <div 
          onClick={() => navigate('/user/profile')}
          className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-4 border border-white/10 shadow-xl group hover:bg-white/10 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {photoURL ? (
                <img 
                  src={photoURL} 
                  alt="Profile" 
                  className="w-11 h-11 rounded-2xl border-2 border-white/10 group-hover:border-white/30 transition-all shadow-md object-cover"
                />
              ) : (
                <div className="w-11 h-11 bg-blue-500 rounded-2xl flex items-center justify-center text-lg font-black border-2 border-white/10 group-hover:border-white/30 transition-all shadow-md">
                  {avatarLetter}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#1e3a8a] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{displayName}</p>
              <div className="flex items-center gap-1">
                <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">User</p>
                <CheckCircle2 className="w-3 h-3 text-blue-400 fill-blue-400/20" />
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>
      {sidebarContent}
    </>
  );
};

export default UserSidebar;
