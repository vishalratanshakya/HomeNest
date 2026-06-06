import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Menu, 
  X, 
  Bell as BellIcon, 
  User, 
  Heart, 
  LogOut, 
  Settings, 
  Calendar,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  History,
  Home,
  Tag,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, bookingService, firestoreService } from '@core/services/firebaseService';
import { formatRelativeTime } from '@core/utils/helpers';
import toast from 'react-hot-toast';
import { useNotifications } from '@core/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function UserNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
  const [currentUser, setCurrentUser] = useState(sessionUser || null);
  const [userDoc, setUserDoc] = useState(sessionUser || null);
  const [authLoading, setAuthLoading] = useState(!sessionUser);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(currentUser?.uid, 'user');
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    // Auth Listener
    const unsubscribeAuth = authService.onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const doc = await firestoreService.getUserDocument(user.uid);
          setUserDoc(doc);
        } catch (e) { /* silent */ }
      } else {
        setUserDoc(null);
      }
      setAuthLoading(false);
    });

    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(prev => prev ? { ...prev, displayName: e.detail.displayName, photoURL: e.detail.photoURL } : prev);
        setUserDoc(prev => prev ? { ...prev, ...e.detail } : e.detail);
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribeAuth();
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch properties for suggestions
  useEffect(() => {
    if (showMobileSearch) {
      const fetchProps = async () => {
        try {
          const props = await bookingService.getProperties();
          setAllProperties(props);
        } catch (error) {
          console.error("Error fetching properties for suggestions:", error);
        }
      };
      fetchProps();
    }
  }, [showMobileSearch]);

  // Filter suggestions
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const filtered = allProperties
        .filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, allProperties]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success('Logged out successfully');
      navigate('/user/home');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/user/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <>
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg shadow-slate-100/50' : 'bg-white'} h-16 border-b border-slate-100 ${location.pathname.startsWith('/user/product/') ? 'hidden md:block' : ''}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center space-x-4">

            <Link to="/user/home" className="flex items-center gap-3 group">
              <img 
                src="/homenest-logo.jpg" 
                alt="HomeNest Logo" 
                className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-10">
            {[
              { label: 'Home', path: '/user/home' },
              { label: 'Sale', path: '/user/sale' },
              { label: 'Rent', path: '/user/rent' },
              { label: 'Contact', path: '/user/contact' },
              { label: 'Vendor', path: '/vendor/login' }
            ].map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/user/home' && location.pathname.startsWith(link.path));
              return (
                <Link 
                  key={link.label}
                  to={link.path} 
                  className={`relative text-base font-bold transition-all duration-300 ${
                    link.label === 'Vendor' 
                      ? 'bg-slate-900 text-white px-5 py-2 rounded-xl hover:bg-primary-600 shadow-lg shadow-slate-200 active:scale-95' 
                      : (isActive ? 'text-primary-600 py-2' : 'text-slate-800 hover:text-primary-600 py-2')
                  }`}
                >
                  {link.label}
                  {isActive && link.label !== 'Vendor' && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary-600 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-1 md:space-x-6">
            {/* Mobile/Tablet Search Button */}
            <div className="xl:hidden">
              <button 
                onClick={() => setShowMobileSearch(true)}
                className="p-1.5 md:p-2.5 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <Search className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="relative hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search properties, areas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-semibold text-slate-800 focus:ring-4 focus:ring-primary-500/5 focus:bg-white focus:border-primary-100 outline-none w-[400px] transition-all placeholder:text-slate-400 shadow-sm"
              />
            </form>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className={`p-1.5 md:p-2.5 rounded-2xl transition-all relative ${
                  showNotifications ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BellIcon className="w-5 h-5 md:w-6 md:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 md:top-2.5 md:right-2.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    ref={notificationRef} 
                    className="absolute right-0 mt-5 w-[380px] bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-[0.2em]">Notifications</h3>
                      <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllAsRead}
                            className="text-[10px] font-black text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors"
                          >
                            Mark all read
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 text-[10px] font-black rounded-full uppercase tracking-tighter">
                            {unreadCount} New
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleMarkAsRead(n.id)} 
                            className={`px-8 py-5 border-b border-slate-50 cursor-pointer hover:bg-slate-50/50 transition-all group relative ${!n.read ? 'bg-primary-50/30' : ''}`}
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <p className={`text-sm leading-snug ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                                  {n.message}
                                </p>
                                <p className="text-[10px] font-black text-primary-500 mt-2 uppercase tracking-widest flex items-center gap-2">
                                  <span className="w-1 h-1 bg-primary-400 rounded-full" />
                                  {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                                </p>
                              </div>
                              {!n.read && (
                                <div className="w-2.5 h-2.5 bg-primary-600 rounded-full mt-1 shrink-0 shadow-lg shadow-primary-200" />
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-20 px-10 text-center">
                          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <BellIcon className="w-10 h-10 text-slate-200" />
                          </div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">All Caught Up</p>
                          <p className="text-[10px] text-slate-300 mt-2 uppercase font-bold">No new notifications at the moment</p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors">
                          View All Activity
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auth Logic */}
            <div className="flex items-center space-x-2 md:space-x-4 pl-2 md:pl-4 border-l border-slate-100">
              <Link 
                to="/vendor/login" 
                className="md:hidden px-2.5 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-lg"
              >
                Vendor
              </Link>
              
              {authLoading ? (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 animate-pulse" />
              ) : currentUser ? (
                <div className="relative group">
                  <button 
                    onClick={() => navigate('/user/profile')}
                    className="flex items-center p-1 md:p-1.5 rounded-2xl border border-slate-100 hover:border-primary-100 hover:bg-primary-50/50 transition-all duration-300 shadow-sm"
                  >
                    {(userDoc?.photoURL || currentUser.photoURL) ? (
                      <img 
                        src={userDoc?.photoURL || currentUser.photoURL} 
                        alt="Profile" 
                        className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                      />
                    ) : (
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white text-xs md:text-sm font-bold shadow-md">
                        {(userDoc?.displayName || userDoc?.name || currentUser.displayName || currentUser.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </button>
                  
                  {/* Dropdown (Desktop Only) */}
                  <div className="hidden md:block absolute right-0 top-full pt-3 opacity-0 translate-y-4 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50 min-w-[280px]">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden p-3">
                      <div className="space-y-1">
                        <Link 
                          to="/user/profile" 
                          className="flex items-center space-x-4 p-3.5 rounded-2xl hover:bg-slate-50 transition-all group/item"
                        >
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover/item:bg-blue-600 group-hover/item:text-white transition-all duration-300">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">My Profile</span>
                        </Link>

                        <Link 
                          to="/user/bookings" 
                          className="flex items-center space-x-4 p-3.5 rounded-2xl hover:bg-slate-50 transition-all group/item"
                        >
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all duration-300">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">My Bookings</span>
                        </Link>

                        <Link 
                          to="/user/saved-properties" 
                          className="flex items-center space-x-4 p-3.5 rounded-2xl hover:bg-slate-50 transition-all group/item"
                        >
                          <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl group-hover/item:bg-pink-600 group-hover/item:text-white transition-all duration-300">
                            <Heart className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">Wishlist</span>
                        </Link>
                      </div>

                      <div className="h-px bg-slate-100 my-2 mx-4" />

                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-4 p-3.5 rounded-2xl hover:bg-rose-50 text-rose-600 transition-all group/item"
                      >
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover/item:bg-rose-600 group-hover/item:text-white transition-all duration-300">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black tracking-tight">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Link 
                    to="/auth/login" 
                    className="flex items-center justify-center w-7 h-7 sm:w-auto sm:h-auto sm:px-8 sm:py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-lg sm:rounded-2xl shadow-md sm:shadow-xl shadow-primary-200 hover:shadow-primary-300 transition-all"
                  >
                    <User className="w-4 h-4 sm:hidden" />
                    <span className="hidden sm:block text-xs font-black uppercase tracking-widest">Login</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[110] bg-white p-6 md:p-10 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Search</h2>
              <button 
                onClick={() => setShowMobileSearch(false)}
                className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => { handleSearch(e); setShowMobileSearch(false); }} className="space-y-6">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
                <input
                  autoFocus
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-transparent focus:border-primary-600/10 focus:bg-white rounded-[2rem] font-bold text-lg outline-none transition-all placeholder:text-slate-300 shadow-sm"
                />
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
                  >
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-6 py-3 bg-slate-50/50">Property Matches</p>
                    {suggestions.map((prop) => (
                      <button
                        key={prop.id}
                        type="button"
                        onClick={() => {
                          navigate(`/user/product/${prop.id}`);
                          setShowMobileSearch(false);
                        }}
                        className="w-full px-6 py-4 flex items-center gap-4 hover:bg-primary-50 transition-colors text-left border-b border-slate-50 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                          {prop.images?.[0] ? (
                            <img src={prop.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{prop.title}</p>
                          <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">{prop.category}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className={suggestions.length > 0 ? "opacity-50 pointer-events-none" : ""}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Quick Categories</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                   {[
                     { label: 'Apartments', value: 'Apartment' },
                     { label: 'Villas', value: 'Villa' },
                     { label: 'Offices', value: 'Office' },
                     { label: 'Land', value: 'Land' },
                     { label: 'Townhouse', value: 'Townhouse' },
                     { label: 'Penthouse', value: 'Penthouse' }
                   ].map((cat) => (
                     <button 
                       key={cat.label}
                       type="button"
                       onClick={() => { 
                         setSearchTerm(cat.value);
                         navigate(`/user/search?q=${encodeURIComponent(cat.value)}`);
                         setShowMobileSearch(false);
                       }}
                       className="py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-50 hover:text-primary-600 border border-transparent hover:border-primary-100 transition-all active:scale-95"
                     >
                       {cat.label}
                     </button>
                   ))}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-6 bg-primary-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-primary-200 flex items-center justify-center gap-4 hover:brightness-110 transition-all mt-4"
              >
                <Search className="w-5 h-5" />
                Show Results
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    {/* Bottom Mobile Tab Bar */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-[9999] flex justify-around items-center p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      {[
        { icon: Home, label: 'Home', path: '/user/home' },
        { icon: Tag, label: 'Sell', path: '/user/sale' },
        { icon: Key, label: 'Rent', path: '/user/rent' },
        { icon: MessageSquare, label: 'Contact', path: '/user/contact' }
      ].map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/user/home' && location.pathname.startsWith(item.path));
        return (
          <Link key={item.label} to={item.path} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-primary-600' : 'text-slate-400'}`}>
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
          </Link>
        )
      })}
    </nav>
    </>
  );
}
