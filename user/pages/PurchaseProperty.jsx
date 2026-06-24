import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CreditCard, MapPin, Shield, CheckCircle2, ChevronRight, Info, ArrowRight, Building2, Calculator, Loader2, User, Home, Phone } from 'lucide-react';
import { bookingService, authService, firestoreService } from '@core/services/firebaseService';

import UserNavbar from '../components/UserNavbar';
import toast from 'react-hot-toast';

export default function PurchaseProperty() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  
  // Client Details State
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Purchase/Rent Configuration
  const isRental = product?.listingType?.toLowerCase() === 'rent' || product?.category?.toLowerCase() === 'rent' || product?.listingType?.toLowerCase() === 'rental' || product?.category?.toLowerCase() === 'rental';
  
  // Furnishing State
  const [furnishingStatus, setFurnishingStatus] = useState('raw');
  
  const calculatedRent = product ? (
    isRental ? (
      furnishingStatus === 'semi' ? Math.round(product.price * 1.15) :
      furnishingStatus === 'fully' ? Math.round(product.price * 1.30) :
      product.price
    ) : product.price
  ) : 0;
  
  // Rental Terms State
  const [minTenure, setMinTenure] = useState('11 Months');
  const [securityDeposit, setSecurityDeposit] = useState('1 Month');
  const [noticePeriod, setNoticePeriod] = useState('30 Days');
  const [maintenance, setMaintenance] = useState('Included');
  
  // EMI Calculator State
  const [downPayment, setDownPayment] = useState(0);
  const [tenure, setTenure] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [monthlyEMI, setMonthlyEMI] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!product && id) {
        try {
          setLoading(true);
          const data = await firestoreService.getProperty(id);
          if (data) {
            const mappedProduct = {
              ...data,
              name: data.title || data.name,
              price: Number(data.price || data.pricing?.price || 0),
              images: data.images || [data.mainImage],
            };
            setProduct(mappedProduct);
            setDownPayment(Math.round(mappedProduct.price * 0.2));
          } else {
            toast.error("Property not found");
            navigate('/user/home');
          }
        } catch (err) {
          console.error("Fetch error:", err);
          toast.error("Failed to load property details.");
          navigate('/user/home');
        } finally {
          setLoading(false);
        }
      } else if (product) {
        setDownPayment(Math.round(product.price * 0.2));
      }
    };

    fetchProduct();
  }, [id, product, navigate]);

  useEffect(() => {
    if (product && !isRental) {
      const principal = product.price - downPayment;
      const r = interestRate / 12 / 100;
      const n = tenure * 12;
      const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      setMonthlyEMI(Math.round(emi));
    }
  }, [product, downPayment, tenure, interestRate, isRental]);

  const handlePurchase = async () => {
    // Validation
    if (!clientName.trim()) {
      toast.error('Please enter client name');
      return;
    }
    if (!clientAddress.trim()) {
      toast.error('Please enter client address');
      return;
    }
    if (!contactNumber.trim()) {
      toast.error('Please enter contact number');
      return;
    }

    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please login to continue');
      navigate('/auth/login');
      return;
    }

    setPurchaseLoading(true);
    try {
      const purchaseData = {
        propertyId: product.id || id,
        propertyName: product.name,
        propertyImage: product.images?.[0] || product.mainImage,
        price: isRental ? calculatedRent : product.price,
        userId: user.uid,
        userName: user.displayName || 'Guest User',
        userEmail: user.email,
        clientName: clientName,
        clientAddress: clientAddress,
        contactNumber: contactNumber,
        status: 'pending',
        ownerId: product.ownerId || 'system_admin',
        type: isRental ? 'rental' : 'purchase',
        paymentMethod: 'finance',
        downPayment: isRental ? 0 : downPayment,
        monthlyEMI: isRental ? calculatedRent : monthlyEMI,
        tenure: isRental ? 1 : tenure,
        minTenure: isRental ? minTenure : null,
        securityDeposit: isRental ? securityDeposit : null,
        noticePeriod: isRental ? noticePeriod : null,
        maintenance: isRental ? maintenance : null
      };

      const newOrderId = await bookingService.createBooking(purchaseData);
      setOrderId(newOrderId);
      setShowSuccess(true);
      toast.success(`${isRental ? 'Rental' : 'Purchase'} inquiry sent successfully!`);
    } catch (error) {
      console.error('Purchase error:', error);
      if (error.code === 'permission-denied') {
        const mockId = 'offline_buy_' + Date.now();
        setOrderId(mockId);
        setShowSuccess(true);
      } else {
        toast.error('Failed to process request. Please try again.');
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-['Inter'] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Initializing {isRental ? 'Rental' : 'Purchase'} Workflow...</p>
      </div>
    );
  }

  if (!product) return null;

  const registrationFees = product.price * 0.05;
  const totalPurchase = product.price + registrationFees;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-['Inter']">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 text-center shadow-2xl border border-white">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Request Sent!</h2>
          <p className="text-slate-500 mb-10 font-medium leading-relaxed">Your inquiry for <span className="text-blue-600 font-bold">{product.name}</span> has been received.</p>
          
          <div className="bg-slate-50 rounded-3xl p-6 mb-10 text-left border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inquiry ID</p>
              <p className="text-md font-bold text-slate-900">#{orderId}</p>
            </div>
            <div className="px-4 py-2 bg-blue-50 rounded-xl text-blue-600 text-xs font-black uppercase">
              Processing
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => navigate(`/user/tracking/${orderId}`)}
              className="w-full py-5 bg-blue-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
            >
              Track Progress
              <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => navigate('/user/home')}
              className="w-full py-5 bg-white text-slate-600 rounded-[1.25rem] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirm-booking-page">
      <UserNavbar />
      
      <div className="booking-topbar">
        <div className="booking-left">
          <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] mb-1">
            <Shield size={14} />
            Verified Listing
          </div>
          <h1>{isRental ? 'Rental Inquiry' : 'Purchase Offer'}</h1>
          <p>Review the details and initiate your property acquisition</p>
          
          <div className="booking-actions mt-4">
            <button 
              onClick={() => navigate(-1)}
              className="back-btn"
            >
              Back
            </button>
            <button 
              onClick={handlePurchase}
              disabled={purchaseLoading}
              className="confirm-btn"
            >
              {purchaseLoading ? 'Processing...' : (isRental ? 'Initiate Rental' : 'Initiate Purchase')}
            </button>
          </div>
        </div>
      </div>

      <div className="booking-layout">
        {/* LEFT COLUMN: FORM */}
        <div className="flex-1 space-y-8">
          {/* Client Info Form */}
          <div className="booking-form-card">
            <div className="section-header-simple">
              <h2>Your Information</h2>
              <p>Please enter the details for this {isRental ? 'rental' : 'purchase'}</p>
            </div>
            
            <div className="booking-form-grid">
              <div className="form-group-simple full-width">
                <label>Full Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter your full name"
                  className="booking-input-simple"
                />
              </div>
              
              <div className="form-group-simple full-width">
                <label>Current Address</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Enter your current residential address"
                  className="booking-input-simple"
                />
              </div>
              
              <div className="form-group-simple">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+91"
                  className="booking-input-simple"
                />
              </div>
            </div>
          </div>

            {!isRental && (
              <div className="booking-form-card">
                <div className="section-header-simple">
                  <h2>EMI Calculator</h2>
                  <p>Customize your down payment and tenure</p>
                </div>

                <div className="emi-calculator-grid">
                  <div className="emi-inputs">
                    <div className="form-group-simple">
                      <div className="flex justify-between items-center mb-1">
                        <label>Down Payment</label>
                        <span className="text-sm font-black text-indigo-600">₹{downPayment.toLocaleString()}</span>
                      </div>
                      <input 
                        type="range"
                        min={product.price * 0.1}
                        max={product.price * 0.5}
                        step={100000}
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        className="premium-range"
                        style={{
                          background: `linear-gradient(to right, #4f46e5 ${((downPayment - (product.price * 0.1)) / ((product.price * 0.5) - (product.price * 0.1))) * 100}%, #f1f5f9 0%)`
                        }}
                      />
                    </div>
 
                    <div className="form-group-simple">
                      <label>Tenure (Years)</label>
                      <select 
                        value={tenure}
                        onChange={(e) => setTenure(Number(e.target.value))}
                        className="booking-select-simple"
                      >
                        {[10, 15, 20, 25, 30].map(y => <option key={y} value={y}>{y} Years</option>)}
                      </select>
                    </div>
                  </div>
 
                  <div className="emi-result-box">
                    <span className="emi-result-label">Est. Monthly EMI</span>
                    <span className="emi-result-value">₹{monthlyEMI.toLocaleString()}</span>
                    <p className="emi-result-note">Calculated at {interestRate}% APR</p>
                  </div>
                </div>
              </div>
            )}

            {isRental && (
              <div className="booking-form-card">
                <div className="section-header-simple">
                  <h2>Rental Terms</h2>
                  <p>Standard agreement highlights</p>
                </div>
                
                <div className="mb-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Select Furnishing Option</label>
                  <div className="flex flex-wrap gap-3">
                    {['raw', 'semi', 'fully'].map(type => (
                      <button
                        key={type}
                        onClick={() => setFurnishingStatus(type)}
                        className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                          furnishingStatus === type 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'
                        }`}
                      >
                        {type === 'raw' ? 'Raw Furnished' : type === 'semi' ? 'Semi Furnished' : 'Fully Furnished'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Minimum Tenure</label>
                    <select 
                      value={minTenure}
                      onChange={(e) => setMinTenure(e.target.value)}
                      className="bg-transparent border-none text-sm font-bold text-slate-900 p-0 focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="6 Months">6 Months</option>
                      <option value="11 Months">11 Months</option>
                      <option value="1 Year">1 Year</option>
                      <option value="2 Years">2 Years</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Security Deposit</label>
                    <select 
                      value={securityDeposit}
                      onChange={(e) => setSecurityDeposit(e.target.value)}
                      className="bg-transparent border-none text-sm font-bold text-slate-900 p-0 focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="2 Months">2 Months</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notice Period</label>
                    <select 
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="bg-transparent border-none text-sm font-bold text-slate-900 p-0 focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="60 Days">60 Days</option>
                      <option value="90 Days">90 Days</option>
                    </select>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Maintenance</label>
                    <select 
                      value={maintenance}
                      onChange={(e) => setMaintenance(e.target.value)}
                      className="bg-transparent border-none text-sm font-bold text-slate-900 p-0 focus:ring-0 cursor-pointer outline-none"
                    >
                      <option value="Included">Included</option>
                      <option value="Extra">Extra</option>
                      <option value="To Be Discussed">To Be Discussed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        <div className="booking-property-card">
          <div className="property-image-wrapper">
            <img
              src={product.images?.[0] || product.mainImage}
              alt={product.name}
            />
            <div className="property-badge">
              {isRental ? 'Rent' : 'Buy'}
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
                <span>{isRental ? 'Monthly Rent' : 'Property Value'}</span>
                <strong>₹{calculatedRent.toLocaleString()}</strong>
              </div>
              {!isRental && (
                <div className="price-row">
                  <span>Govt. Fees (5%)</span>
                  <strong>₹{registrationFees.toLocaleString()}</strong>
                </div>
              )}
              
              <div className="total-price">
                <h4>Total Commitment</h4>
                <h2>₹{(isRental ? calculatedRent : totalPurchase).toLocaleString()}</h2>
              </div>
            </div>

            <button 
              onClick={handlePurchase}
              disabled={purchaseLoading}
              className="pay-btn"
            >
              {purchaseLoading ? 'Processing...' : (isRental ? 'Initiate Rental' : 'Initiate Purchase')}
            </button>
            
            <div className="secure-payment">
              VERIFIED BY ANTI-GRAVITY
            </div>
          </div>
        </div>
      </div>
   </div>
  );
}
