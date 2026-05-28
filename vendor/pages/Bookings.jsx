import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  Trash2,
  MoreVertical,
  ChevronRight,
  Download,
  Mail,
  Phone,
  MessageSquare,
  Eye,
  MapPin,
  CalendarCheck,
  Zap,
  PhoneCall,
  LayoutGrid,
  TrendingUp,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from '../components/VendorSidebar';
import VendorHeader from '../components/VendorHeader';
import toast from 'react-hot-toast';
import { bookingService, authService } from '../../src/core/services/firebaseService';
import { formatRelativeTime } from '../../src/core/utils/helpers';

export default function Bookings() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [search, setSearch] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = bookingService.getVendorBookings(
      user.uid,
      (data) => {
        const formattedData = data.map(b => ({
          id: b.id,
          propertyId: b.propertyId || b.id, // preserve actual property ID
          customer: b.userName || b.customerName || 'Guest User',
          email: b.userEmail || 'No email provided',
          phone: b.userPhone || 'No phone provided',
          avatar: b.userPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.id}`,
          propertyName: b.propertyName || b.propertyTitle || 'Property Inquiry',
          location: b.location || b.propertyLocation || 'Location Pending',
          amount: Number(b.propertyPrice) || Number(b.amount) || 0,
          budgetRange: b.budgetRange || `₹${(Number(b.propertyPrice) || Number(b.amount) || 0).toLocaleString()}`,
          inquiryDate: b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString() : new Date(b.createdAt).toLocaleDateString(),
          createdAt: b.createdAt,
          listingType: b.listingType || 'sell',
          status: b.bookingStatus || b.status || 'New Lead'
        }));
        setItems(formattedData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'new lead': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      case 'contacted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'site visit': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'negotiation': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'closed': return 'bg-green-50 text-green-600 border-green-100';
      case 'lost': return 'bg-red-50 text-red-600 border-red-100';
      case 'confirmed': return 'bg-green-50 text-green-600 border-green-100';
      case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const handleExport = () => {
    const headers = ['ID', 'Customer', 'Email', 'Phone', 'Property', 'Location', 'Type', 'Status'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        item.id,
        `"${item.customer}"`,
        item.email,
        item.phone,
        `"${item.propertyName}"`,
        `"${item.location}"`,
        item.listingType,
        item.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported as CSV');
  };

  const handleAction = (action, name) => {
    toast.success(`${action} initiated for ${name}`);
  };

  const handleDelete = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Lead removed successfully');
    setOpenMenuId(null);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus);
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Unable to update booking status');
    } finally {
      setOpenMenuId(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.customer.toLowerCase().includes(search.toLowerCase()) || 
                          item.propertyName.toLowerCase().includes(search.toLowerCase()) ||
                          item.phone.includes(search);
    const matchesFilter = filterType === 'All' || item.listingType === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans" onClick={() => setOpenMenuId(null)}>
      <VendorSidebar />
      <main className="flex-1 lg:ml-72 ml-0 min-h-screen bg-slate-50/50 transition-all duration-300">
        <VendorHeader />
        
        <div className="px-4 sm:px-10 py-6 sm:py-10">
          {/* Header */}
          <div className="flex flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Property Visits</h1>
              <p className="text-[10px] sm:text-sm text-gray-500 mt-1 font-medium">Manage your property visits and bookings</p>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleExport}
                className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" /> 
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-row gap-2 mb-8">
            <div className="relative w-1/2 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>
            <div className="relative w-1/2">
              <select 
                className="w-full h-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm outline-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="sell">Sell</option>
                <option value="rent">Rent</option>
              </select>
            </div>
          </div>

          {/* List Layout (Horizontal Cards) */}
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-gray-100 flex flex-col gap-4 group"
                >
                  {/* Customer Column */}
                  <div className="flex items-center gap-4 w-full">
                    <div className="relative">
                      <img
                        src={item.photoURL || `https://ui-avatars.com/api/?name=${item.customer}&background=random&color=fff&bold=true&rounded=true`}
                        className="w-16 h-16 rounded-[1.25rem] object-cover border-4 border-gray-50 shadow-sm group-hover:scale-105 transition-transform"
                        alt={item.customer}
                      />
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                        item.listingType === 'sell' ? 'bg-rose-500' : item.listingType === 'rent' ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}>
                        <TrendingUp className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 tracking-tight">{item.customer}</h3>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                          <Mail className="w-3.5 h-3.5" /> {item.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                          <Phone className="w-3.5 h-3.5" /> {item.phone}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Info Column */}
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        item.listingType === 'sell' ? 'bg-rose-50 text-rose-600' : item.listingType === 'rent' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {item.listingType}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Inquiry {formatRelativeTime(item.createdAt)}</span>
                    </div>
                    <h4 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.propertyName}</h4>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500">{item.location}</span>
                    </div>
                  </div>

                  {/* Pricing/Budget Column */}
                  <div className="w-full lg:w-auto">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Client Budget
                    </p>
                    <p className="text-xl font-black text-gray-900">
                      {item.budgetRange}
                    </p>
                  </div>

                  {/* Status & Actions Column */}
                  <div className="flex items-center flex-wrap gap-3 lg:gap-6 lg:ml-auto shrink-0 w-full lg:w-auto">
                    <span className={`px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(item.status)}`}>
                      {item.status}
                    </span>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleAction('WhatsApp', item.customer)}
                        className="p-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                        title="WhatsApp"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleAction('Call', item.customer)}
                        className="p-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                        title="Call"
                      >
                        <PhoneCall className="w-5 h-5" />
                      </button>
                      <div className="relative ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === item.id ? null : item.id);
                          }}
                          className="p-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 transition-all"
                        >
                          <MoreHorizontal className="w-6 h-6" />
                        </button>

                        {openMenuId === item.id && (
                          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 py-3 animate-slide-up">
                            <button 
                              onClick={() => navigate(`/user/product/${item.propertyId}`)}
                              className="w-full text-left px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center gap-3"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(item.id, 'Closed')}
                              className="w-full text-left px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all flex items-center gap-3"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Mark as Closed
                            </button>
                            <div className="h-px bg-gray-100 my-2 mx-4" />
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="w-full text-left px-6 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-all flex items-center gap-3"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Inquiry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <div className="py-24 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <LayoutGrid className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Booking found</h3>
                <p className="text-gray-500 mt-2">Adjust your filters or search terms to find what you're looking for.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}
