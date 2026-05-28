import { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  Download, 
  MoreVertical, 
  MapPin, 
  User, 
  Building2, 
  IndianRupee,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { bookingService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOrders = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsubscribe = bookingService.getAllBookings((data) => {
      setBookings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingService.updateBookingStatus(bookingId, status);
      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.propertyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || booking.bookingStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Property Visits Management</h1>
          <p className="text-gray-500 font-medium">Track visits, property confirmed sales, and rentals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-5 h-5" />
            <span>Export Bookings</span>
          </button>
        </div>
      </div>

      {/* Booking Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bookings</p>
            <p className="text-xl font-black text-gray-900">{bookings.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirmed</p>
            <p className="text-xl font-black text-gray-900">{bookings.filter(b => b.bookingStatus === 'confirmed').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
            <p className="text-xl font-black text-gray-900">{bookings.filter(b => b.bookingStatus === 'pending').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancelled</p>
            <p className="text-xl font-black text-gray-900">{bookings.filter(b => b.bookingStatus === 'cancelled').length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500" />
          <input
            type="text"
            placeholder="Search by ID, user, or property name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500/20 md:w-48"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Info</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Property</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parties</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {filteredBookings.map((booking, idx) => (
                  <motion.tr
                    key={booking.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/80 transition-all group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">#{booking.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : 'New'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shadow-sm">
                           <img src={booking.propertyImage} className="w-full h-full object-cover" />
                        </div>
                        <div className="max-w-[200px]">
                           <p className="font-black text-gray-900 text-xs truncate">{booking.propertyName}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                             <MapPin className="w-3 h-3" /> {booking.propertyLocation?.split(',')[0]}
                           </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center">
                            <User className="w-3 h-3 text-indigo-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{booking.userName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-amber-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-500">{booking.vendorName || 'Independent'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-gray-900 flex items-center gap-1">
                          ₹{Number(booking.propertyPrice || booking.totalAmount || 0).toLocaleString()}
                        </span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Paid via {booking.paymentMethod || 'Wallet'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                        booking.bookingStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                        booking.bookingStatus === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {booking.bookingStatus === 'confirmed' ? <CheckCircle2 className="w-3 h-3" /> : 
                         booking.bookingStatus === 'cancelled' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page 1 of {Math.ceil(filteredBookings.length / 10) || 1}</p>
           <div className="flex gap-2">
              <button className="p-2 bg-white rounded-xl border border-gray-100 disabled:opacity-50" disabled><ChevronLeft className="w-5 h-5" /></button>
              <button className="p-2 bg-white rounded-xl border border-gray-100"><ChevronRight className="w-5 h-5" /></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
