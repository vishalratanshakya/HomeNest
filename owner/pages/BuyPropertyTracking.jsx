import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Home, MapPin, Mail, Phone, Clock, FileText, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OwnerSidebar from '../components/OwnerSidebar';
import OwnerHeader from '../components/OwnerHeader';
import toast from 'react-hot-toast';
import { bookingService, authService } from '../../src/core/services/firebaseService';
import { formatRelativeTime } from '../../src/core/utils/helpers';

export default function OwnerBuyPropertyTracking() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const unsubscribe = bookingService.getOwnerBookings(
      user.uid,
      (data) => {
        const filteredData = (data || [])
          .filter(b => b.type === 'purchase' || b.type === 'rental')
          .map(b => ({
            id: b.id,
            propertyId: b.propertyId || b.id,
            customer: b.clientName || b.userName || 'Guest Buyer',
            email: b.userEmail || 'No email provided',
            phone: b.contactNumber || b.userPhone || 'No phone provided',
            propertyName: b.propertyName || 'Property Purchase',
            location: b.clientAddress || 'Location Pending',
            price: b.price || b.amount || 0,
            type: b.type || 'purchase',
            createdAt: b.createdAt,
            status: b.bookingStatus || b.status || 'pending'
          }));
        setItems(filteredData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus);
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`Status successfully updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Unable to update status');
    }
  };

  const getStatusStyles = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'completed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.customer.toLowerCase().includes(search.toLowerCase()) || 
                          item.propertyName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterType === 'All' || item.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <OwnerSidebar />
      <main className="flex-1 lg:ml-72 ml-0 min-h-screen bg-slate-50/50 transition-all duration-300">
        <OwnerHeader />
        
        <div className="px-4 sm:px-10 py-6 sm:py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Buy/Rent Property Inquiries</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Manage offers, down-payments, and buyer agreements for your listings</p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search by client or property..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm outline-none"
              />
            </div>
            <div className="w-48">
              <select 
                className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm outline-none"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Inquiries</option>
                <option value="purchase">Purchase</option>
                <option value="rental">Rental</option>
              </select>
            </div>
          </div>

          {/* List Layout */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 flex flex-col lg:flex-row items-start lg:items-center gap-8 group"
                  >
                    {/* Customer Info */}
                    <div className="min-w-[240px]">
                      <h3 className="text-base font-black text-gray-900 tracking-tight">{item.customer}</h3>
                      <div className="flex flex-col gap-1 mt-2 text-xs font-semibold text-gray-400">
                        <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {item.email}</span>
                        <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {item.phone}</span>
                      </div>
                    </div>

                    {/* Property details */}
                    <div className="flex-1 min-w-[200px]">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        item.type === 'purchase' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {item.type}
                      </span>
                      <h4 className="text-base font-bold text-gray-900 mt-2">{item.propertyName}</h4>
                      <p className="text-xs font-semibold text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {item.location}
                      </p>
                    </div>

                    {/* Offer Price */}
                    <div className="min-w-[140px]">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Offer Amount</p>
                      <p className="text-lg font-black text-indigo-600">₹{Number(item.price).toLocaleString()}</p>
                    </div>

                    {/* Status dropdown & action */}
                    <div className="flex items-center gap-4 ml-auto shrink-0">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusUpdate(item.id, e.target.value)}
                        className={`px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm outline-none ${getStatusStyles(item.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={() => navigate(`/user/product/${item.propertyId}`)}
                        className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all border border-gray-100 hover:border-indigo-100"
                        title="View Property Details"
                      >
                        <Home className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">No Inquiries Found</h3>
                <p className="text-gray-500 mt-2">No active purchase or rental tracking records found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
