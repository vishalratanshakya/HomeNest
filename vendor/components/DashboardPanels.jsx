import { Plus, Home, CalendarRange, ChevronRight, MapPin, ArrowRight, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import BulkImportModal from './BulkImportModal';

export function QuickActions({ isLoading }) {
  const navigate = useNavigate();
  
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  const actions = [
    { 
      title: 'Add New Property', 
      desc: 'List a new property', 
      icon: Plus, 
      color: 'from-[#4F46E5] to-[#6366F1]', 
      to: '/vendor/add-property'
    },
    { 
      title: 'Bulk Import', 
      desc: 'Upload properties via JSON', 
      icon: Bot, 
      color: 'from-[#8B5CF6] to-[#7C3AED]', 
      onClick: () => setIsBulkModalOpen(true)
    },
    { 
      title: 'Manage Properties', 
      desc: 'View and edit listings', 
      icon: Home, 
      color: 'from-[#10B981] to-[#059669]', 
      to: '/vendor/properties'
    },
    { 
      title: 'View Bookings', 
      desc: 'Manage incoming bookings', 
      icon: CalendarRange, 
      color: 'from-[#F59E0B] to-[#D97706]', 
      to: '/vendor/bookings'
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse"></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="section-title px-1 mb-0">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => action.onClick ? action.onClick() : navigate(action.to)}
            className={`w-full p-4 rounded-xl bg-gradient-to-r ${action.color} text-white flex items-center gap-4 shadow-md transition-all group`}
          >
            <div className="p-2 bg-white/20 rounded-lg">
              <action.icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm tracking-tight">{action.title}</p>
              <p className="text-[10px] font-medium text-white/80">{action.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <BulkImportModal 
        isOpen={isBulkModalOpen} 
        onClose={() => setIsBulkModalOpen(false)} 
        onSuccess={() => navigate('/vendor/properties')}
      />
    </div>
  );
}

export function RecentProperties({ properties, isLoading }) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="card animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl"></div>)}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="section-title mb-0">Recent Properties</h3>
        <button onClick={() => navigate('/vendor/properties')} className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest hover:underline">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {properties.map((property, idx) => (
          <motion.div 
            key={idx} 
            onClick={() => navigate('/vendor/properties')}
            className="flex items-center gap-4 p-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
              <img src={property.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{property.name}</p>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                {typeof property.location === 'object' 
                  ? `${property.location.city}, ${property.location.state}` 
                  : property.location}
              </p>
              <p className="text-indigo-600 font-bold text-[11px] mt-1">₹{property.price.toLocaleString()}</p>
            </div>
            <div className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${
              property.status === 'Available' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
            }`}>
              {property.status}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
