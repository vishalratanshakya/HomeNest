import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./userDashboard.css";
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import { authService, bookingService, firestoreService } from '../../src/core/services/firebaseService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';

const Bookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      const unsubscribe = bookingService.getUserBookings(user.uid, (data) => {
        setBookings(data || []);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setBookings([]);
      setLoading(false);
    }
  }, []);

  const handleCancel = async (bookingId, isSample, propertyName) => {
    try {
      await bookingService.deleteBooking(bookingId);
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      toast.success('Booking cancelled and removed successfully');
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error('Failed to cancel booking');
    }
  };

  const formatPrice = (price) => {
    if (typeof price === 'string') return price;
    return `₹${Number(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* HEADER */}
      <div className="dashboard-card mb-6">
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">My Property Bookings</h2>
            <p className="text-sm text-slate-500 font-medium">Track your scheduled property visits and booking status.</p>
          </div>
          <div className="flex justify-between items-center px-5 py-4 bg-blue-50 text-blue-600 rounded-2xl w-full">
            <span className="font-black text-xs sm:text-sm uppercase tracking-widest">Total Bookings</span>
            <span className="font-black text-xl sm:text-2xl">{bookings.length}</span>
          </div>
        </div>
      </div>

      {/* BOOKINGS LIST */}
      <div className="bookings-grid mt-8 pb-10">
        <AnimatePresence>
          {bookings.map((booking, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="booking-card border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
              key={booking.id}
            >
              {/* IMAGE */}
              <div className="relative overflow-hidden">
                <img
                  src={cloudinaryService.optimizeUrl(booking.image || (booking.propertyImage), { width: 400, height: 300, crop: 'fill' })}
                  alt=""
                  className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  {(() => {
                    const status = (booking.bookingStatus || booking.status || 'pending').toUpperCase();
                    return (
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg ${
                        status === 'CONFIRMED' ? 'bg-emerald-500 text-white' :
                        status === 'PENDING' ? 'bg-amber-500 text-white' :
                        status === 'COMPLETED' ? 'bg-blue-500 text-white' :
                        'bg-slate-500 text-white'
                      }`}>
                        {status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* CONTENT */}
              <div className="p-4">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {booking.propertyName}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary-500" /> {booking.location}
                </p>

                {/* DETAILS */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Visit Date</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                      {booking.visitDate}
                    </h4>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Visit Time</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                      {booking.visitTime}
                    </h4>
                  </div>
                </div>

                {/* PRICE */}
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Property Price</span>
                  <h2 className="text-xl font-black text-primary-600 mt-0.5">
                    {formatPrice(booking.price)}
                  </h2>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={() => navigate(`/user/product/${booking.propertyId || booking.id}`)}
                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 transition-all active:scale-95"
                  >
                    View Property
                  </button>
                  <button 
                    onClick={() => handleCancel(booking.id, false, booking.propertyName)}
                    className="flex-1 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {bookings.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
              <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">No Bookings Found</h3>
            <p className="text-slate-400 font-bold mt-2">You haven't scheduled any property visits yet.</p>
            <button 
              onClick={() => navigate('/user/home')}
              className="mt-8 px-10 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-100"
            >
              Explore Properties
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Bookings;
