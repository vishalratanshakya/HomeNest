import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, bookingService } from '../../src/core/services/firebaseService';
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, Compass, Trash2, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import "./userDashboard.css";

const PropertyVisits = () => {
  const navigate = useNavigate();
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);

  // ─── Auth-aware data fetch (fixes refresh issue) ───────────────────────────
  useEffect(() => {
    let unsubscribeBookings = () => {};

    const unsubscribeAuth = authService.onAuthStateChange((user) => {
      // Clean up any previous bookings listener
      unsubscribeBookings();

      if (user) {
        setLoading(true);
        unsubscribeBookings = bookingService.getUserBookings(user.uid, (data) => {
          // Filter out cancelled visits — they should NEVER show in the list
          const active = (data || []).filter(
            v => (v.bookingStatus || v.status || '').toUpperCase() !== 'CANCELLED'
          );
          setVisits(active);
          setLoading(false);
        });
      } else {
        // Not logged in — show empty state, no dummy data
        setVisits([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
    };
  }, []);

  // ─── Tab filtering (excluding CANCELLED always) ───────────────────────────
  useEffect(() => {
    if (activeTab === 'ALL') {
      setFilteredVisits(visits);
    } else {
      setFilteredVisits(visits.filter(v => {
        const status = (v.bookingStatus || v.status || 'PENDING').toUpperCase();
        return status === activeTab;
      }));
    }
  }, [visits, activeTab]);

  // ─── Cancel visit — updates status to 'cancelled' in Firestore ───────────
  const handleCancelVisit = async (visitId, propertyName) => {
    const confirmed = window.confirm(`Cancel your visit for "${propertyName}"? This cannot be undone.`);
    if (!confirmed) return;

    setCancellingId(visitId);
    try {
      // Update status in Firestore — do NOT delete so owner/admin can see it was cancelled
      await bookingService.updateBookingStatus(visitId, 'cancelled');

      // Remove from local UI immediately (real-time listener will confirm)
      setVisits(prev => prev.filter(v => v.id !== visitId));
      toast.success(`Visit for "${propertyName}" has been cancelled.`);
    } catch (error) {
      console.error('Cancel visit error:', error);
      toast.error('Failed to cancel visit. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    const parsed = Number(price);
    if (isNaN(parsed)) return price;
    if (parsed >= 10000000) return `₹${(parsed / 10000000).toFixed(2)} Cr`;
    if (parsed >= 100000) return `₹${(parsed / 100000).toFixed(2)} L`;
    return `₹${parsed.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-blue-600">LIVE</div>
        </div>
      </div>
    );
  }

  const tabs = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED'];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Panel */}
      <div className="dashboard-card bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
        <div className="card-header flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Property Visits</h2>
            <p className="profile-subtitle mt-1">Manage and track your schedule of on-site property explorations.</p>
          </div>
          <div className="flex flex-wrap gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-white text-blue-600 shadow-md shadow-slate-100 border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visits List */}
      <div className="mt-8 space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredVisits.map((visit, index) => {
            const status = (visit.bookingStatus || visit.status || 'PENDING').toUpperCase();
            const isCancelling = cancellingId === visit.id;

            return (
              <motion.div
                layout
                key={visit.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.05 }}
                className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 group flex flex-col md:flex-row"
              >
                {/* Image Section */}
                <div className="relative w-full md:w-80 shrink-0 h-64 md:h-auto min-h-[220px] overflow-hidden">
                  <img
                    src={cloudinaryService.optimizeUrl(visit.image || visit.propertyImage || visit.mainImage, { width: 400, height: 300, crop: 'fill' })}
                    alt={visit.propertyName || visit.propertyTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400'; }}
                  />
                  <div className="absolute top-6 left-6">
                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md border border-white/20 ${
                      status === 'CONFIRMED' ? 'bg-emerald-500 text-white' :
                      status === 'PENDING'   ? 'bg-amber-500 text-white' :
                      status === 'COMPLETED' ? 'bg-blue-500 text-white' :
                      'bg-slate-500 text-white'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                          {visit.propertyName || visit.propertyTitle || 'Property Visit'}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mt-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          {typeof visit.location === 'object'
                            ? `${visit.location.city || ''}, ${visit.location.state || ''}`.trim().replace(/^,|,$/g, '')
                            : visit.location || 'Location not specified'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate Value</span>
                        <h4 className="text-2xl font-black text-slate-900 mt-1">
                          {formatPrice(visit.price || visit.propertyPrice)}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled Date</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">
                            {visit.visitDate || visit.bookingDate || visit.visitSchedule?.date || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expected Time</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">
                            {visit.visitTime || visit.visitSchedule?.time || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 pt-6 border-t border-slate-50">
                    <button
                      onClick={() => navigate(`/user/product/${visit.propertyId || visit.id}`)}
                      className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 group/btn active:scale-95"
                    >
                      <span>Explore Details</span>
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>

                    {status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCancelVisit(visit.id, visit.propertyName || visit.propertyTitle || 'this property')}
                        disabled={isCancelling}
                        className="w-full sm:w-auto px-6 py-4 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 ml-auto disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isCancelling ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Cancelling...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            <span>Cancel Visit</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredVisits.length === 0 && !loading && (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Compass className="w-10 h-10 text-slate-300 animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">
              {activeTab === 'ALL' ? 'No Property Visits' : `No ${activeTab} Visits`}
            </h3>
            <p className="text-slate-400 font-bold mt-2">
              {activeTab === 'ALL'
                ? "You haven't scheduled any property visits yet."
                : `You don't have any visits with status "${activeTab}".`}
            </p>
            <button
              onClick={() => navigate('/user/home')}
              className="mt-8 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
            >
              Discover Properties
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyVisits;
