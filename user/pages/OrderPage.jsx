import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingService, authService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  ChevronLeft, 
  Info, 
  CreditCard, 
  Smartphone, 
  Building, 
  Wallet, 
  CheckCircle, 
  User, 
  Home, 
  Clock, 
  Calculator, 
  ArrowRight, 
  ShieldCheck,
  Tag,
  ChevronRight,
  Globe,
  HandCoins,
  Minus,
  Plus
} from 'lucide-react';

export default function UserOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { product } = location.state || {};
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [errors, setErrors] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  
  const [formData, setFormData] = useState({
    // Step 1: Personal & Billing
    fullName: '',
    email: '',
    phone: '',
    // Step 1: Address Details
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    saveAddress: true,
    // Step 2: Payment Method
    paymentMethod: 'card'
  });

  // EMI Calculator State
  const [emiDetails, setEmiDetails] = useState({
    amount: 0,
    downPayment: 0,
    rate: 8.5,
    duration: 20
  });

  useEffect(() => {
    if (!product) {
      navigate('/user/home');
      return;
    }
    const user = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.displayName || '',
        email: user.email || ''
      }));
    }
    setEmiDetails(prev => ({ 
      ...prev, 
      amount: product.price,
      downPayment: Math.round(product.price * 0.2) // Default 20% down payment
    }));
  }, [product, navigate]);

  const propertyPrice = product?.price || 0;
  const bookingFee = Math.round(propertyPrice * 0.01);
  const taxes = Math.round(propertyPrice * 0.001);
  const totalAmount = propertyPrice + bookingFee + taxes - discount;

  const calculateEMI = () => {
    const P = Math.max(0, emiDetails.amount - emiDetails.downPayment);
    const r = emiDetails.rate / 12 / 100;
    const n = emiDetails.duration * 12;
    if (P === 0 || n === 0) return 0;
    if (r === 0) return Math.round(P / n);
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const calculateTotalInterest = () => {
    const emi = calculateEMI();
    const P = Math.max(0, emiDetails.amount - emiDetails.downPayment);
    const totalPayment = emi * (emiDetails.duration * 12);
    return Math.max(0, totalPayment - P);
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
      if (formData.phone.replace(/\D/g, '').length < 10) newErrors.phone = 'Valid phone is required';
      if (!formData.fullAddress.trim()) newErrors.fullAddress = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (formData.pincode.trim().length < 5) newErrors.pincode = 'Valid pincode is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      toast.error('Please fix the errors before proceeding');
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      setDiscount(50000);
      toast.success('Coupon applied! ₹50,000 off');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate payment success
    setTimeout(async () => {
      try {
        const user = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user) {
          throw new Error('Please login to complete purchase');
        }

        const orderData = {
          userId: user?.uid || user?.id || 'anonymous',
          ownerId: product.ownerId || 'unknown_owner',
          customerDetails: formData,
          propertyInfo: {
            id: product.id || 'unknown_id',
            name: product.name || 'Untitled Property',
            price: product.price || 0,
            image: product.images?.[0] || product.image || 'https://via.placeholder.com/800',
            location: product.location || {}
          },
          paymentInfo: {
            method: formData.paymentMethod,
            amount: totalAmount,
            discount: discount
          },
          orderStatus: 'completed',
          createdAt: new Date().toISOString()
        };

        const id = await bookingService.createOrder(orderData);
        setOrderId(id);
        setCurrentStep(3);
        toast.success('Purchase Successful 🎉');
      } catch (error) {
        console.error('Purchase error:', error);
        toast.error(error.message || 'Failed to process purchase');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-100 rounded-full scale-150 blur-3xl opacity-20"></div>
            <div className="relative bg-primary-50 w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-16 h-16 text-primary-600" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-gray-900 tracking-normal">Purchase Successful 🎉</h1>
            <p className="text-xl text-gray-500 font-medium">
              Congratulations! Your ownership process has officially begun.
            </p>
          </div>

          <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 text-left space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-6">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                <p className="text-lg font-mono font-bold text-gray-900">#{orderId.slice(-12).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Amount Paid</p>
                <p className="text-2xl font-black text-primary-600 italic">₹{totalAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <img src={product.images?.[0]} className="w-24 h-24 rounded-3xl object-cover shadow-lg" alt="" />
              <div>
                <h3 className="text-xl font-black text-gray-900">{product.name}</h3>
                <p className="text-gray-500 flex items-center">
                  <MapPin className="w-4 h-4 mr-1 text-primary-500" />
                  {product.location.city}, {product.location.state}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={() => navigate('/user/profile', { state: { activeTab: 'purchases' } })}
              className="py-5 bg-gray-900 text-white rounded-[2rem] font-black hover:bg-black transition-all flex items-center justify-center group shadow-xl"
            >
              Track Order
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/user/home')}
              className="py-5 bg-white text-gray-900 border-2 border-gray-100 rounded-[2rem] font-black hover:bg-gray-50 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Step Indicator */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-20 sm:h-24 flex items-center">
            <div className="flex-1 flex items-center">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-50 rounded-2xl transition-all group"
              >
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 group-hover:border-primary-100 transition-all">
                  <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-primary-600 group-hover:-translate-x-0.5 transition-all" />
                </div>
                <span className="font-bold text-gray-500 group-hover:text-gray-900 transition-colors">Back</span>
              </button>
            </div>
            
            <div className="flex-[2] flex flex-col items-center justify-center">
              <h1 className="text-lg sm:text-2xl font-black text-gray-900">Purchase Property</h1>
            </div>

            <div className="flex-1 hidden lg:flex items-center justify-end space-x-2">
              <span className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
                Secure
              </span>
            </div>
          </div>

          {/* Stepper Moved to a separate row for better centering */}
          <div className="pb-4 flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-8">
              {[
                { step: 1, label: 'Details', icon: User },
                { step: 2, label: 'Payment', icon: CreditCard },
                { step: 3, label: 'Done', icon: CheckCircle }
              ].map((s, idx) => (
                <div key={s.step} className="flex items-center">
                  <div className={`flex flex-col sm:flex-row items-center sm:space-x-2 transition-all ${
                    currentStep >= s.step ? 'text-primary-600' : 'text-gray-300'
                  }`}>
                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all border-2 ${
                      currentStep >= s.step ? 'border-primary-600 bg-primary-50 text-primary-600 shadow-lg shadow-primary-100' : 'border-gray-100 bg-gray-50 text-gray-400'
                    }`}>
                      {currentStep > s.step ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : s.step}
                    </div>
                    <span className="text-[8px] sm:text-xs font-bold uppercase tracking-wider mt-1 sm:mt-0">{s.label}</span>
                  </div>
                  {idx < 2 && <div className={`w-3 sm:w-8 h-[2px] mx-1 sm:mx-4 ${currentStep > s.step ? 'bg-primary-600' : 'bg-gray-100'}`}></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Left Side: Forms */}
          <div className="space-y-12 order-2 lg:order-1">
            {currentStep === 1 ? (
              <div className="space-y-12 animate-in slide-in-from-left duration-500">
                {/* SECTION 1: Personal & Billing */}
                <section className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3 text-3xl">👤</span>
                    Personal & Billing
                  </h2>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                          className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all ${
                            errors.fullName ? 'border-red-500' : 'border-gray-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
                          }`}
                          placeholder="As per legal documents"
                        />
                        {errors.fullName && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.fullName}</p>}
                      </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all ${
                            errors.email ? 'border-red-500' : 'border-gray-100 focus:border-primary-500'
                          }`}
                        />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all ${
                            errors.phone ? 'border-red-500' : 'border-gray-100 focus:border-primary-500'
                          }`}
                        />
                        {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECTION 2: Address Details */}
                <section className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3 text-3xl">📍</span>
                    Address Details
                  </h2>
                  <div className="space-y-6">
                    <textarea
                      value={formData.fullAddress}
                      onChange={(e) => setFormData({...formData, fullAddress: e.target.value})}
                      placeholder="Street address, building, apartment number"
                      rows="3"
                      className={`w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-500 resize-none ${errors.fullAddress ? 'border-red-500' : ''}`}
                    />
                    {errors.fullAddress && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.fullAddress}</p>}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <input type="text" placeholder="City" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none focus:border-primary-500 ${errors.city ? 'border-red-500' : 'border-gray-100'}`} />
                        {errors.city && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.city}</p>}
                      </div>
                      <div className="col-span-1">
                        <input type="text" placeholder="State" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-500" />
                      </div>
                      <div className="col-span-1">
                        <input type="text" placeholder="Pincode" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} className={`w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none focus:border-primary-500 ${errors.pincode ? 'border-red-500' : 'border-gray-100'}`} />
                        {errors.pincode && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.pincode}</p>}
                      </div>
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({...formData, country: e.target.value})}
                        className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-500 appearance-none font-bold text-gray-700"
                      >
                        <option>India</option>
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>UAE</option>
                      </select>
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.saveAddress}
                        onChange={(e) => setFormData({...formData, saveAddress: e.target.checked})}
                        className="w-6 h-6 rounded-lg border-2 border-gray-200 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-gray-600 font-bold group-hover:text-gray-900 transition-colors">Save this address for future legal paperwork</span>
                    </label>
                  </div>
                </section>

                <button
                  onClick={handleNextStep}
                  className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-bold text-xl hover:bg-black transition-all flex items-center justify-center group shadow-2xl shadow-gray-200"
                >
                  Continue to Payment
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="space-y-12 animate-in slide-in-from-right duration-500">
                {/* SECTION 3: Payment Method */}
                <section className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <span className="mr-3 text-3xl">💳</span>
                    Payment Method
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'upi', icon: Smartphone, label: 'UPI Payment', desc: 'Google Pay, PhonePe, Paytm' },
                      { id: 'card', icon: CreditCard, label: 'Credit / Debit Card', desc: 'Visa, Mastercard, Amex' },
                      { id: 'netbanking', icon: Building, label: 'Net Banking', desc: 'All major Indian banks' },
                      { id: 'cod', icon: HandCoins, label: 'Pay on Site (COD)', desc: 'Pay during property visit or handover' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setFormData({...formData, paymentMethod: method.id})}
                        className={`flex items-center p-6 rounded-3xl border-2 transition-all ${
                          formData.paymentMethod === method.id 
                            ? 'border-primary-500 bg-primary-50/50 ring-4 ring-primary-500/10' 
                            : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-6 ${
                          formData.paymentMethod === method.id ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <method.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <p className={`font-bold ${formData.paymentMethod === method.id ? 'text-gray-900' : 'text-gray-500'}`}>{method.label}</p>
                          <p className="text-sm text-gray-400 font-bold">{method.desc}</p>
                        </div>
                        <div className={`ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          formData.paymentMethod === method.id ? 'border-primary-600' : 'border-gray-200'
                        }`}>
                          {formData.paymentMethod === method.id && <div className="w-3 h-3 bg-primary-600 rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-5 bg-white text-gray-600 border-2 border-gray-100 rounded-[2rem] font-bold hover:bg-gray-50 transition-all"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] py-5 bg-primary-600 text-white rounded-[2rem] font-bold text-xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 flex items-center justify-center group"
                  >
                    {loading ? <Clock className="w-6 h-6 animate-spin" /> : (
                      <>
                        Complete Purchase
                        <ShieldCheck className="w-6 h-6 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Sticky Summary & EMI */}
          <div className="lg:sticky lg:top-32 space-y-8 order-1 lg:order-2 lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto no-scrollbar pr-1">
            {/* Price Summary */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200 border border-gray-50 space-y-8">
              <h2 className="text-2xl font-black text-gray-900 flex items-center justify-center">
                <span className="mr-3 text-3xl">💰</span>
                Price Breakdown
              </h2>

              <div className="space-y-4">
                <div className="flex flex-col items-center text-center space-y-4 pb-8 border-b border-gray-50">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary-100 rounded-full blur-2xl opacity-20"></div>
                    <img src={product.images?.[0]} className="relative w-32 h-32 rounded-[2rem] object-cover shadow-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{product.name}</h3>
                    <p className="text-sm text-primary-600 font-black uppercase tracking-widest">{product.category}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex justify-between font-bold text-gray-500">
                    <span>Base Property Price</span>
                    <span>₹{propertyPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-500">
                    <span>Booking Fee (1%)</span>
                    <span>₹{bookingFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-500">
                    <span>Legal & GST (0.1%)</span>
                    <span>₹{taxes.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between font-bold text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  
                  <div className="pt-6 border-t-2 border-dashed border-gray-100 space-y-4">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <span className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-widest opacity-40">Total Amount</span>
                      <p className="text-4xl sm:text-5xl font-black text-primary-600 tracking-tighter">
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                      Inclusive of all taxes & processing fees
                    </p>
                  </div>
                </div>

                {/* Coupon Field */}
                <div className="pt-6">
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Coupon Code (WELCOME10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-12 pr-32 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-primary-500 transition-all font-bold"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium EMI Calculator */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-gray-200 border border-gray-50 space-y-6">
              <div className="flex flex-col items-center space-y-2">
                <h2 className="text-2xl font-black text-gray-900 flex items-center">
                  <span className="mr-3 text-3xl">🧮</span>
                  EMI Calculator
                </h2>
                <div className="flex items-center space-x-2 text-primary-500 font-bold text-sm">
                   <Calculator className="w-4 h-4" />
                   <span>Financial Planning</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Property Price</label>
                    <input
                      type="number"
                      value={emiDetails.amount}
                      onChange={(e) => setEmiDetails({...emiDetails, amount: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Down Payment</label>
                    <input
                      type="number"
                      value={emiDetails.downPayment}
                      onChange={(e) => setEmiDetails({...emiDetails, downPayment: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={emiDetails.rate}
                      onChange={(e) => setEmiDetails({...emiDetails, rate: Number(e.target.value)})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-gray-700 outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Duration (Years)</label>
                    <div className="flex items-center space-x-2 bg-primary-50 rounded-2xl p-1">
                      <button 
                        type="button"
                        onClick={() => setEmiDetails(prev => ({...prev, duration: Math.max(5, prev.duration - 1)}))}
                        className="p-1.5 hover:bg-white rounded-xl text-primary-600 transition-all shadow-sm active:scale-95"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold text-primary-600 min-w-[70px] text-center">
                        {emiDetails.duration} Years
                      </span>
                      <button 
                        type="button"
                        onClick={() => setEmiDetails(prev => ({...prev, duration: Math.min(30, prev.duration + 1)}))}
                        className="p-1.5 hover:bg-white rounded-xl text-primary-600 transition-all shadow-sm active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={emiDetails.duration}
                    onChange={(e) => setEmiDetails({...emiDetails, duration: Number(e.target.value)})}
                    className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    style={{
                      background: `linear-gradient(to right, #0089ff ${((emiDetails.duration - 5) / (30 - 5)) * 100}%, #f3f4f6 ${((emiDetails.duration - 5) / (30 - 5)) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase px-1">
                    <span>5 Years</span>
                    <span>30 Years</span>
                  </div>
                </div>

                <div className="bg-primary-600 rounded-3xl p-4 sm:p-6 text-white shadow-xl shadow-primary-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-80">Monthly EMI</p>
                      <p className="text-2xl sm:text-3xl font-bold tracking-normal">₹{calculateEMI().toLocaleString('en-IN')}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] font-bold uppercase opacity-80">Total Interest</p>
                      <p className="text-lg sm:text-xl font-bold">₹{calculateTotalInterest().toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-[10px] font-bold opacity-80 flex items-center">
                      <Info className="w-3 h-3 mr-1" />
                      Based on reducing balance
                    </p>
                    <p className="text-[10px] font-bold opacity-80">
                      Total: ₹{(calculateEMI() * emiDetails.duration * 12).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
