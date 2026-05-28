import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  Tag, 
  Key, 
  Users, 
  UserSquare2, 
  CalendarCheck, 
  CreditCard, 
  Star, 
  AlertTriangle, 
  BarChart3, 
  Bell, 
  Settings, 
  LogOut,
  Building2,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import { authService } from '@core/services/firebaseService';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { 
      name: 'Properties', 
      icon: Home, 
      path: '/admin/properties',
      submenu: [
        { name: 'All Inventory', path: '/admin/properties' },
        { name: 'Add Property', path: '/admin/add-property' },
        { name: 'Sell Properties', path: '/admin/sell-properties' },
        { name: 'Rent Properties', path: '/admin/rent-properties' },
      ]
    },
    { name: 'Vendors', icon: UserSquare2, path: '/admin/vendors' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Property Visits', icon: CalendarCheck, path: '/admin/orders' },
    { name: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { name: 'Reviews', icon: Star, path: '/admin/reviews' },
    { name: 'Reports', icon: AlertTriangle, path: '/admin/reports' },
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { name: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const handleLogout = async () => {
    await authService.logout();
    navigate('/admin/login');
  };

  const toggleSubmenu = (name) => {
    setOpenSubmenu(openSubmenu === name ? null : name);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        className={`fixed top-0 left-0 h-screen w-[280px] bg-white border-r border-gray-100 shadow-sm z-50 rounded-r-[2.5rem] flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/homenest-logo.jpg" 
              alt="HomeNest Logo" 
              className="h-10 w-auto object-contain rounded-lg"
            />
          </div>
          <button onClick={toggleSidebar} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.name} className="space-y-1">
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`
                        w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
                        ${openSubmenu === item.name ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold tracking-tight">{item.name}</span>
                      </div>
                      {openSubmenu === item.name ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                    </button>
                    <AnimatePresence>
                      {openSubmenu === item.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pl-11 pr-4 space-y-1 mt-1"
                        >
                          {item.submenu.map((sub) => (
                            <NavLink
                              key={sub.name}
                              to={sub.path}
                              onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                              className={({ isActive }) => `
                                block py-2.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all
                                ${isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-400 hover:text-indigo-500'}
                              `}
                            >
                              {sub.name}
                            </NavLink>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={({ isActive }) => `
                      flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group
                      ${isActive
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' 
                        : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${item.name === 'Dashboard' ? '' : 'group-hover:scale-110 transition-transform'}`} />
                      <span className="text-sm font-bold tracking-tight">{item.name}</span>
                    </div>
                  </NavLink>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer Section */}
        <div className="p-4 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all duration-300 group"
          >
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
               <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase">Logout System</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
