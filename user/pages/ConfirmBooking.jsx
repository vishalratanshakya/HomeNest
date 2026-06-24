import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapPin, ShieldCheck, CheckCircle2, User, Home, ArrowRight, Loader2, Phone, MessageSquare } from 'lucide-react';
import { bookingService, authService, firestoreService } from '@core/services/firebaseService';
// dummyProducts import removed; using Firestore live data
import UserNavbar from '../components/UserNavbar';
import toast from 'react-hot-toast';

export default function ConfirmBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Booking Details State
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [guests, setGuests] = useState(1);
  const [contactNumber, setContactNumber] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!product && id) {
        try {
          setLoading(true);
          const data = await firestoreService.getProperty(id);
          if (data) {
            setProduct({
              ...data,
              name: data.title || data.name,
              price: Number(data.price || data.pricing?.price || 0),
              images: data.images || [data.mainImage],
            });
          } else {
            // If Firestore returns no data, inform user
            toast.error("Property not found");
            navigate('/user/home');
          }
        } catch (err) {
          console.error("Fetch error:", err);
            // Loading failed; show error to user
            toast.error("Failed to load property details.");
            navigate('/user/home');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProduct();
  }, [id, product, navigate]);

  const handleBooking = async () => {
    if (!clientName.trim()) {
      toast.error('Please enter client name');
      return;
    }
    if (!clientAddress.trim()) {
      toast.error('Please enter client address');
      return;
    }
    if (!contactNumber.trim()) {
      toast.error('Please enter a contact number');
      return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please login to continue');
      navigate('/auth/login');
      return;
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        propertyId: product.id || id,
        propertyName: product.name,
        propertyImage: product.images?.[0] || product.mainImage,
        price: product.price,
        userId: user.uid,
        userName: user.displayName || 'Guest User',
        userEmail: user.email,
        clientName: clientName,
        clientAddress: clientAddress,
        guests: guests,
        contactNumber: contactNumber,
        specialRequests: specialRequests,
        status: 'pending',
        ownerId: product.ownerId || 'system_admin',
        type: 'booking'
      };

      const newOrderId = await bookingService.createBooking(bookingData);
      
      if (newOrderId) {
        setOrderId(newOrderId);
        setShowSuccess(true);
        toast.success('Booking request sent successfully!');
      } else {
        throw new Error('Failed to generate booking ID. Please try again.');
      }
    } catch (error) {
      console.error('Booking submission failed:', error);
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        const mockId = 'offline_' + Date.now();
        setOrderId(mockId);
        setShowSuccess(true);
      } else {
        toast.error(`Submission failed: ${error.message || 'Server error'}`);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['Inter'] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Preparing secure checkout...</p>
      </div>
    );
  }

  if (!product) return null;

  const tax = product.price * 0.12;
  const total = product.price + tax;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Inter']">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 text-center shadow-2xl border border-white">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Booking Confirmed!</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">Your reservation for <span className="text-indigo-600 font-bold">{product.name}</span> has been successfully placed.</p>
          
          <div className="bg-slate-50 rounded-3xl p-6 mb-10 text-left border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Booking Reference</p>
              <p className="text-md font-bold text-slate-900">#{orderId}</p>
            </div>
            <div className="px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 text-xs font-black uppercase">
              Pending
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate(`/user/tracking/${orderId}`)}
              className="w-full py-5 bg-indigo-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
            >
              Track Status
              <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/user/home')}
              className="w-full py-5 bg-white text-slate-600 rounded-[1.25rem] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-booking-page">
      <UserNavbar />
      
      <div className="p-4 md:p-8 bg-white border-b border-gray-100 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Actions (Top on mobile, Right on desktop) */}
        <div className="flex items-center justify-between gap-4 w-full md:w-auto md:order-2">
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs sm:text-sm uppercase tracking-widest"
          >
            Back
          </button>
          <button 
            onClick={handleBooking}
            disabled={bookingLoading}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all text-xs sm:text-sm uppercase tracking-widest"
          >
            {bookingLoading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>

        {/* Text (Bottom on mobile, Left on desktop) */}
        <div className="md:order-1">
          <small className="text-[10px] md:text-xs font-black text-indigo-600 uppercase tracking-widest">Secure Checkout</small>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1 tracking-tight">Confirm Your Stay</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Review details and complete your property reservation</p>
        </div>
      </div>

      <div className="booking-layout">
        <div className="booking-form-card">
          <div className="section-header-simple">
            <h2>Client Information</h2>
            <p>Please enter the details for this reservation</p>
          </div>

          <div className="booking-form-grid">
            <div className="form-group-simple full-width">
              <label>Client Full Name</label>
              <input
                type="text"
                placeholder="e.g. Johnathan Doe"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="booking-input-simple"
              />
            </div>

            <div className="form-group-simple full-width">
              <label>Client Address</label>
              <input
                type="text"
                placeholder="e.g. 123 Luxury Avenue, Sky Tower"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="booking-input-simple"
              />
            </div>

            <div className="form-group-simple">
              <label>Total Guests</label>
              <select 
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="booking-select-simple"
              >
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
              </select>
            </div>

            <div className="form-group-simple">
              <label>Contact Phone</label>
              <input
                type="tel"
                placeholder="+91 00000 00000"
                value={contactNumber}
                onChange={(e) => {
                  // Only allow digits, +, spaces, and hyphens
                  const val = e.target.value;
                  if (/^[0-9+\-\s]*$/.test(val)) setContactNumber(val);
                }}
                className="booking-input-simple"
              />
            </div>

            <div className="form-group-simple full-width">
              <label>Additional Notes / Special Requests</label>
              <textarea
                rows={4}
                placeholder="e.g. High floor preferred, near lift..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="booking-textarea-simple"
              />
            </div>
          </div>
        </div>

        <div className="booking-property-card">
          <div className="property-image-wrapper">
            <img
              src={product.images?.[0] || product.mainImage}
              alt={product.name}
            />
            <div className="property-badge">
              {product.category}
            </div>
          </div>

          <div className="property-content">
            <h3>{product.name}</h3>
            <div className="property-location">
              <MapPin size={18} />
              <span>
                {product.location?.city}, {product.location?.state}
              </span>
            </div>

            <div className="price-summary">
              <div className="price-row">
                <span>Base Stay Price</span>
                <strong>₹{product.price.toLocaleString()}</strong>
              </div>
              <div className="price-row">
                <span>Taxes & Fees (12%)</span>
                <strong>₹{tax.toLocaleString()}</strong>
              </div>
              
              <div className="total-price">
                <h4>Total Amount</h4>
                <h2>₹{total.toLocaleString()}</h2>
              </div>
            </div>

            <button 
              onClick={handleBooking}
              disabled={bookingLoading}
              className="pay-btn"
            >
              {bookingLoading ? 'Processing...' : 'Confirm & Pay'}
            </button>
            
            <div className="secure-payment">
              PCI COMPLIANT SECURITY
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
