import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "./userDashboard.css";
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import { authService, bookingService } from '../../src/core/services/firebaseService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, Building2, Eye, Trash2 } from 'lucide-react';
import UserNavbar from '../components/UserNavbar';

const BuyPropertyTracking = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      const unsubscribe = bookingService.getUserBookings(user.uid, (data) => {
        const filtered = (data || []).filter(b => b.type === 'purchase' || b.type === 'rental');
        setInquiries(filtered);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setInquiries([]);
      setLoading(false);
    }
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this inquiry?")) return;
    try {
      await bookingService.deleteBooking(id);
      setInquiries(prev => prev.filter(b => b.id !== id));
      toast.success('Inquiry cancelled successfully');
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error('Failed to cancel inquiry');
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
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h2>Property Purchase & Rental Inquiries</h2>
            <p className="profile-subtitle">Track the progress of your buying/renting transactions and offers.</p>
          </div>
          <div className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest">
            Total Inquiries: {inquiries.length}
          </div>
        </div>
      </div>

      {/* INQUIRIES LIST */}
      <div className="bookings-grid mt-8 pb-10">
        <AnimatePresence>
          {inquiries.map((inquiry, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="booking-card border border-slate-100 shadow-sm bg-white rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
              key={inquiry.id}
            >
              {/* IMAGE */}
              <div className="relative overflow-hidden">
                <img
                  src={cloudinaryService.optimizeUrl(inquiry.propertyImage || inquiry.image, { width: 400, height: 300, crop: 'fill' })}
                  alt=""
                  className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  {(() => {
                    const status = (inquiry.bookingStatus || inquiry.status || 'pending').toUpperCase();
                    return (
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg ${
                        status === 'CONFIRMED' || status === 'APPROVED' ? 'bg-emerald-500 text-white' :
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
                  {inquiry.propertyName}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary-500" /> {inquiry.clientAddress || 'Address details pending'}
                </p>

                {/* DETAILS */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Type</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5 capitalize">
                      {inquiry.type}
                    </h4>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Inquiry Date</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                      {inquiry.createdAt?.toDate 
                        ? inquiry.createdAt.toDate().toLocaleDateString() 
                        : new Date(inquiry.createdAt || Date.now()).toLocaleDateString()}
                    </h4>
                  </div>
                </div>

                {/* PRICE */}
                <div className="mt-4 pt-4 border-t border-slate-50">
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-widest">Pricing</span>
                  <h2 className="text-xl font-black text-primary-600 mt-0.5">
                    {formatPrice(inquiry.price)}
                  </h2>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={() => navigate(`/user/tracking/${inquiry.id}`)}
                    className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Eye size={12} />
                    Track Progress
                  </button>
                  <button 
                    onClick={() => handleCancel(inquiry.id)}
                    className="flex-1 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={12} />
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {inquiries.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200">
              <Building2 className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">No Inquiries Found</h3>
            <p className="text-slate-400 font-bold mt-2">You haven't initiated any buy or rent requests yet.</p>
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

export default BuyPropertyTracking;
