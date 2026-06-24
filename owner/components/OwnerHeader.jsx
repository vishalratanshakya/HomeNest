import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell as BellIcon, Calendar, ChevronDown, MessageSquare, IndianRupee, X, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { bookingService, authService } from '../../src/core/services/firebaseService';
import { formatRelativeTime } from '../../src/core/utils/helpers';
import CalendarPicker from './CalendarPicker';
import { useNotifications } from '../../src/core/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function OwnerHeader() {
  const location = useLocation();
  const path = location.pathname;
  const isDashboard = path === '/owner/dashboard';
  
  // Dynamic titles for other pages
  const getPageTitle = () => {
    if (isDashboard) return 'Dashboard';
    if (path.includes('messages')) return 'Messages';
    if (path.includes('reviews')) return 'Reviews';
    if (path.includes('bookings')) return 'Bookings';
    if (path.includes('properties')) return 'My Properties';
    if (path.includes('earnings')) return 'Earnings & Wallet';
    if (path.includes('profile')) return 'Account Profile';
    if (path.includes('settings')) return 'System Settings';
    if (path.includes('add-property')) return 'Add New Property';
    return 'Owner Panel';
  };

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRange, setSelectedRange] = useState('May 31, 2022 - June 29, 2022');
  const [user, setUser] = useState(null);
  
  const notificationRef = useRef(null);
  const datePickerRef = useRef(null);

  const currentUser = React.useMemo(() => {
    return authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
  }, []);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(currentUser?.uid, 'owner');

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }

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
  }, [currentUser]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    await markAllAsRead();
    setShowNotifications(false);
    // Broadcast to sidebar if needed
    window.dispatchEvent(new CustomEvent('notifications-read'));
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
  };

  return (
    <header className={`${isDashboard ? 'h-24' : 'h-20'} bg-white/80 backdrop-blur-md px-2 md:px-4 lg:px-10 flex items-center justify-between sticky top-0 z-40 border-b border-slate-100 transition-all duration-300`}>
      <div className="flex items-center gap-3 lg:gap-4">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-owner-sidebar'))}
          className="lg:hidden p-2.5 sm:p-3 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm active:scale-95 group hover:border-indigo-500"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600 group-hover:text-indigo-600 transition-colors" />
        </button>
        
        <div className="flex flex-col min-w-0">
          {isDashboard ? (
            <>
              <h1 className="text-sm sm:text-lg lg:text-3xl font-black text-slate-900 tracking-tight leading-tight flex items-center gap-1 sm:gap-2 truncate">
                Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}! <span className="animate-bounce text-xs sm:text-xl lg:text-3xl">👋</span>
              </h1>
              <p className="text-slate-400 text-[6px] sm:text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 lg:mt-1.5 opacity-80 truncate">
                Real-Time Insights Dashboard
              </p>
            </>
          ) : (
            <>
              <h1 className="text-base lg:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
                {getPageTitle()}
              </h1>
              <p className="text-slate-400 text-[7px] lg:text-[9px] font-black uppercase tracking-[0.2em] mt-0.5 lg:mt-1 truncate">
                Owner Portal / {getPageTitle()}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowDatePicker(false);
            }}
            className={`p-3 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm group relative ${showNotifications ? 'border-indigo-600 ring-4 ring-indigo-50' : 'hover:border-slate-300'}`}
          >
            <BellIcon className={`w-5 h-5 ${showNotifications ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 z-50 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors">Mark all read</button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-4 hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0 flex items-start gap-4 group cursor-pointer ${!n.read ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className={`p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0`}>
                          <BellIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                          <p className="text-[9px] font-black text-indigo-500 mt-1.5 uppercase tracking-widest">
                            {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <BellIcon className="w-6 h-6 text-slate-200" />
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No new alerts</p>
                      <p className="text-[10px] text-slate-300 mt-1 uppercase font-bold text-center">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date Filter / Calendar */}
        {isDashboard && (
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowNotifications(false);
              }}
              className={`flex items-center gap-2 lg:gap-4 px-3 lg:px-6 py-3 bg-white border border-slate-200 rounded-2xl transition-all shadow-sm group ${showDatePicker ? 'border-indigo-600 ring-4 ring-indigo-50' : 'hover:border-slate-300'}`}
            >
              <Calendar className={`w-4 h-4 lg:w-5 h-5 ${showDatePicker ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-600'}`} />
              <span className="text-xs lg:text-sm font-black text-slate-900 tracking-tight whitespace-nowrap hidden md:block">{selectedRange}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showDatePicker ? 'rotate-180 text-indigo-600' : ''}`} />
            </button>

            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 z-50"
                >
                  <CalendarPicker 
                    initialRange={selectedRange}
                    onApply={(range) => {
                      setSelectedRange(range);
                      setShowDatePicker(false);
                    }}
                    onCancel={() => setShowDatePicker(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}
