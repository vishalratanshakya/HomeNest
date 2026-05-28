import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserSidebar from './UserSidebar';
import { Menu, Home, Search, X, MapPin, Building2, Star, Bell as BellIcon, Tag, Key, MessageSquare } from 'lucide-react';
import { firestoreService } from '../../src/core/services/firebaseService';
import { useCategories } from '../../src/core/contexts/CategoryContext';
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import { useNotifications } from '../../src/core/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const UserDashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { categories } = useCategories();
  const navigate = useNavigate();
  const location = useLocation();

  const sessionUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(sessionUser?.uid, 'user');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await firestoreService.getProperties({ status: 'active' });
        const filtered = results.filter(p => 
          (p.title || p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.location?.city || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 5); // Limit results
        setSearchResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleResultClick = (propertyId) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(`/user/product/${propertyId}`);
  };


  return (
    <div className="dashboard-page">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-[80]">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate('/user/home')}
        >
          <img 
            src="/homenest-logo.jpg" 
            alt="HomeNest Logo" 
            className="h-8 w-auto object-contain rounded-md"
          />
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <Search className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)} 
              className={`p-2 rounded-xl transition-all relative ${
                showNotifications ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  ref={notificationRef} 
                  className="absolute right-0 mt-3 w-[320px] bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-[100]"
                >
                  <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-[0.2em]">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markAsRead(n.id)} 
                          className={`px-6 py-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50/50 transition-all flex gap-3 ${!n.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className="flex-1">
                            <p className={`text-xs leading-snug ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>
                              {n.message}
                            </p>
                            <p className="text-[9px] font-black text-blue-500 mt-2 uppercase tracking-widest">
                              {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1 shrink-0" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 px-6 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <BellIcon className="w-5 h-5 text-slate-300" />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">All Caught Up</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <UserSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] lg:hidden"
          />
        )}
      </AnimatePresence>

        {/* CONTENT */}
        <div className="dashboard-content pt-16 lg:pt-0">
          <Outlet />
        </div>
      </div>

      {/* SEARCH OVERLAY */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex flex-col bg-white/95 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 flex items-center gap-4 max-w-4xl mx-auto w-full">
              <div className="relative flex-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search properties, cities, or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-slate-100/50 rounded-3xl text-lg font-bold text-slate-900 border-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
                />
              </div>
              <button 
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-4 bg-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
              <div className="max-w-4xl mx-auto">
                
                {/* Popular Categories */}
                {!searchQuery && (
                  <div className="mb-12">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Popular Categories</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {categories.slice(0, 4).map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setIsSearchOpen(false);
                            navigate(`/user/search?category=${cat.id}`);
                          }}
                          className="p-6 bg-white border border-slate-100 rounded-[2rem] text-center hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all group"
                        >
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <p className="font-black text-slate-900 text-xs uppercase tracking-widest">{cat.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchQuery && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {isSearching ? 'Searching...' : `Found ${searchResults.length} Results`}
                      </h3>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {searchResults.map(p => (
                          <div 
                            key={p.id}
                            onClick={() => handleResultClick(p.id)}
                            className="p-4 bg-white border border-slate-100 rounded-[2rem] flex items-center gap-6 cursor-pointer hover:border-blue-500 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
                          >
                            <img 
                              src={cloudinaryService.optimizeUrl(p.mainImage || p.images?.[0], { width: 100, height: 100, crop: 'fill' })} 
                              alt="" 
                              className="w-20 h-20 rounded-2xl object-cover shadow-md group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-1">
                              <h4 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                {p.title || p.name}
                              </h4>
                              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mt-1">
                                {p.category || 'Property'}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-slate-400">
                                <span className="flex items-center gap-1 text-[10px] font-bold">
                                  <MapPin className="w-3 h-3" /> {p.location?.city || 'Location'}
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-bold">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" /> {p.rating || '5.0'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right pr-4">
                              <p className="text-xl font-black text-slate-900">₹{Number(p.price).toLocaleString()}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Starting Price</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !isSearching && (
                      <div className="text-center py-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                          <Search className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-lg font-black text-slate-900 uppercase tracking-tight">No Results Found</p>
                        <p className="text-slate-400 text-sm font-bold mt-2">Try searching with a different term</p>
                      </div>
                    )}

                    <div className="pt-8">
                      <button 
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/user/search?q=${searchQuery}`);
                        }}
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl"
                      >
                        See All Results
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <Link key={item.label} to={item.path} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
};

export default UserDashboardLayout;
