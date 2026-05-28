import { Search, Bell, Calendar, Menu, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@core/services/firebaseService';
import { motion } from 'framer-motion';
import { useSearch } from '@core/contexts/SearchContext';
import { useNotifications } from '@core/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useSearch();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications('admin');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        {/* Left Side: Mobile Menu + Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          <div className="relative group hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search properties, users, bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[350px] bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-gray-400 font-medium outline-none"
            />
          </div>
        </div>

        {/* Right Side: Icons + Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="hidden sm:flex p-3 text-gray-500 hover:bg-gray-50 rounded-2xl transition-all">
            <Calendar className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-3 text-gray-500 hover:bg-gray-50 rounded-2xl transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-black text-gray-900 uppercase tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-indigo-500' : 'bg-transparent'}`} />
                        <div>
                          <p className="text-sm font-bold text-gray-900 mb-0.5">{n.title}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
                            {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">No notifications yet</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                  View all activity
                </button>
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-black text-gray-900 leading-none mb-1 uppercase tracking-tight">Admin Portal</p>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Super User</p>
            </div>
            <div className="relative group">
              <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-0.5 shadow-lg shadow-indigo-100">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              
              {/* Profile Dropdown (Simplified) */}
              <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
