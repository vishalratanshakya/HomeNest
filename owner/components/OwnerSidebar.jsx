import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  Calendar, 
  Wallet, 
  MessageSquare, 
  Star, 
  User, 
  Settings,
  LogOut,
  CheckCircle2,
  Plus,
  X,
  Menu,
  Bell as BellIcon,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { firestoreService, authService, cloudinaryService } from '../../src/core/services/firebaseService';

export default function OwnerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [messagesCount, setMessagesCount] = useState(0);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isVisitsOpen, setIsVisitsOpen] = useState(location.pathname.startsWith('/owner/tracking'));

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    const handleClose = () => setIsOpen(false);
    
    window.addEventListener('toggle-owner-sidebar', handleToggle);
    window.addEventListener('close-owner-sidebar', handleClose);
    
    return () => {
      window.removeEventListener('toggle-owner-sidebar', handleToggle);
      window.removeEventListener('close-owner-sidebar', handleClose);
    };
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const firebaseUser = authService.getCurrentUser();
      const sessionUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
      
      let uid = firebaseUser?.uid || sessionUser?.uid;
      let email = firebaseUser?.email || sessionUser?.email;
      let role = sessionUser?.role || 'owner';
      
      if (uid) {
        let displayName = sessionUser.displayName;
        let photoURL = firebaseUser?.photoURL || sessionUser.photoURL;
        
        try {
          const userDoc = await firestoreService.getUserDocument(uid);
          if (userDoc) {
            displayName = userDoc.displayName || userDoc.name || userDoc.fullName || displayName;
            photoURL = userDoc.photoURL || photoURL;
            role = userDoc.role || role;
            // Also grab email from Firestore if not available from auth
            email = email || userDoc.email;
          }
        } catch (error) {
          console.error("Error loading user profile in sidebar:", error);
        }
        
        const updatedUser = {
          uid,
          email,
          role,
          displayName: displayName || sessionUser?.displayName || firebaseUser?.displayName || 'Owner',
          photoURL: photoURL || ''
        };
        
        setUser(updatedUser);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } else {
        setUser({ uid: 'mock', displayName: 'Owner', role: 'owner', email: '' });
      }
    };
    fetchUser();

    const handleProfileUpdate = (e) => {
      if (e.detail) {
        const sessionUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
        const updatedUser = {
          ...sessionUser,
          ...e.detail,
          role: e.detail.role || sessionUser.role || 'owner'
        };
        setUser(updatedUser);
        sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, []);

  useEffect(() => {
    if (!user || user.uid === 'mock') return;
    
    const unsubscribe = firestoreService.subscribeToConversations(
      { ownerId: user.uid },
      (conversations) => {
        const unreadTotal = conversations.reduce((acc, conv) => acc + (conv.unreadForOwner ?? 0), 0);
        setMessagesCount(unreadTotal);
      }
    );
    
    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/auth/login');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  useEffect(() => {
    const handleRead = () => setMessagesCount(0);
    window.addEventListener('notifications-read', handleRead);
    return () => window.removeEventListener('notifications-read', handleRead);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/owner/dashboard' },
    { icon: Home, label: 'My Properties', path: '/owner/properties' },
    { icon: Plus, label: 'Add New Property', path: '/owner/add-property', isPrimary: true },
    { 
      icon: Calendar, 
      label: 'Property Visits', 
      isCollapsible: true,
      children: [
        { label: 'Buy Property Tracking', path: '/owner/tracking/buy' },
        { label: 'Book Property Tracking', path: '/owner/tracking/book' }
      ]
    },
    { icon: Wallet, label: 'Earnings', path: '/owner/earnings' },
    { icon: MessageSquare, label: 'Messages', path: '/owner/messages', badge: messagesCount },
    { icon: BellIcon, label: 'Notifications', path: '/owner/notifications' },
    { icon: Star, label: 'Reviews', path: '/owner/reviews' },
    { icon: User, label: 'Profile', path: '/owner/profile' },
    { icon: Settings, label: 'Settings', path: '/owner/settings' },
    { icon: LogOut, label: 'Logout', path: '/logout' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`
        w-72 h-screen bg-gradient-to-b from-[#2E32BB] via-[#1E2296] to-[#121564] text-white 
        fixed left-0 top-0 z-50 flex flex-col shadow-2xl transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute right-4 top-8 p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Logo Section */}
        <div className="p-8">
          <div className="flex flex-col gap-3">
            <div className="bg-white p-2.5 rounded-2xl w-fit shadow-xl shadow-black/20">
              <img 
                src="/homenest-logo.jpg" 
                alt="HomeNest Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em]">Owner Panel</span>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1.5 custom-scrollbar overflow-y-auto">
        {menuItems.map((item) => {
          if (item.isCollapsible) {
            const isSubActive = location.pathname.startsWith('/owner/tracking');
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => setIsVisitsOpen(!isVisitsOpen)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group text-white/60 hover:bg-white/5 hover:text-white
                    ${isSubActive ? 'bg-white/10 text-white shadow-md' : ''}
                  `}
                >
                  <div className="w-6 h-6 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold tracking-wide">{item.label}</span>
                  <ChevronRight size={16} className={`ml-auto transition-transform duration-300 ${isVisitsOpen ? 'rotate-90 text-white' : 'text-white/40'}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isVisitsOpen && (
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
              onClick={(e) => {
                if (item.path === '/logout') {
                  e.preventDefault();
                  handleLogout();
                }
              }}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
                ${isActive 
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-md border border-white/10' 
                  : 'text-white/60 hover:bg-white/5 hover:text-white'}
                ${item.isPrimary ? 'my-2' : ''}
              `}
            >
              <div className={`
                w-6 h-6 flex items-center justify-center transition-all duration-300
                group-hover:scale-110
              `}>
                <item.icon className={`w-5 h-5 ${item.label === 'Logout' ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-sm font-bold tracking-wide">{item.label}</span>
              
              {item.badge && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-rose-900/40">
                  {item.badge}
                </span>
              )}
              
              {!item.badge && !item.isPrimary && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-40 transition-opacity" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Spacing to replace removed button */}
      <div className="h-4" />

      {/* User Profile Card */}
      <div className="p-6" onClick={() => navigate('/owner/profile')}>
        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-4 border border-white/10 shadow-xl group hover:bg-white/10 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img 
                src={user?.photoURL ? cloudinaryService.optimizeUrl(user.photoURL, { width: 100, height: 100, crop: 'fill' }) : `https://ui-avatars.com/api/?name=${user?.displayName || 'Owner'}&background=0D8ABC&color=fff&rounded=true&bold=true`} 
                alt="Profile" 
                className="w-11 h-11 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-all shadow-md object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#121564] rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.displayName || user?.name || user?.fullName || 'Owner'}</p>
              <p className="text-[9px] font-bold text-white/50 truncate mt-0.5">
                {user?.email || ''}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </>
  );
}
