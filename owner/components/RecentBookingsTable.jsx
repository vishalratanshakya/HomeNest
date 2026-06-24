import { MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function RecentBookingsTable({ bookings, isLoading }) {
  const navigate = useNavigate();

  const getBookingStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getPaymentStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'refunded': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  if (isLoading) {
    return (
      <div className="card animate-pulse space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-12 bg-gray-50 rounded-xl w-full"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="card !p-0 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="section-title mb-0">Recent Bookings</h3>
        <button 
          onClick={() => navigate('/owner/bookings')}
          className="text-indigo-600 text-xs font-bold hover:underline transition-all"
        >
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Booking ID</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Customer</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Property</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Payment</th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((booking, idx) => (
              <tr key={booking.id} className="hover:bg-gray-50/50 transition-all group">
                <td className="px-6 py-4 text-[10px] font-bold text-gray-400 tracking-wider">#{booking.id}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                      <img src={booking.avatar} alt={booking.customer} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-bold text-gray-900 tracking-tight">{booking.customer}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                      <img src={booking.propertyImage} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 leading-tight">{booking.propertyName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-gray-900 tracking-tight">₹{booking.amount.toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getBookingStatusStyles(booking.status)}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getPaymentStatusStyles(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-200 rounded-lg transition-all group">
                    <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
