import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingService, authService } from '@core/services/firebaseService';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  LogOut,
  Home,
  Calendar,
  Heart,
  Bell,
  Settings,
  Eye,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Key,
  Trash2,
  Upload,
  Camera as CameraIcon,
  Shield,
  ChevronLeft,
  Lock,
  EyeOff,
  Globe,
  Plus,
  ShoppingBag,
  CreditCard as PaymentIcon,
  MessageSquare,
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'personal');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Image Adjustment States
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const [userData, setUserData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+91 9876543210',
    profileImage: 'https://ui-avatars.com/api/?name=User&background=random',
    address: {
      street: '',
      buildingName: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    }
  });

  const [bookings, setBookings] = useState([]);
  const [savedProperties, setSavedProperties] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    let unsubscribeBookings = () => {};

    const syncUserData = (user) => {
      if (!user) {
        // Handle mock user or guest
        const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
        const uid = sessionUser?.uid || 'mock_user_id';
        
        console.log("Profile: Using session/mock user", uid);
        
        const userKey = `user_profile_${uid}`;
        const savedProfile = JSON.parse(sessionStorage.getItem(userKey) || '{}');

        setUserData(prev => ({
          ...prev,
          fullName: savedProfile.fullName || sessionUser?.displayName || prev.fullName,
          email: sessionUser?.email || prev.email,
          profileImage: savedProfile.profileImage || sessionUser?.photoURL || prev.profileImage
        }));

        // Fetch bookings
        unsubscribeBookings = bookingService.getUserBookings(uid, (data) => {
          console.log("Profile: Received bookings (mock/session)", data.length);
          setBookings(data);
        });

        // Fetch Purchases (Orders)
        const fetchPurchases = async () => {
          try {
            const data = await bookingService.getUserOrders(uid);
            setPurchases(data);
          } catch (error) {
            console.error("Error fetching purchases:", error);
          }
        };
        fetchPurchases();
        return;
      }

      // Real Firebase User
      console.log("Profile: Real user identified", user.uid);
      const userKey = `user_profile_${user.uid}`;
      const savedProfile = JSON.parse(sessionStorage.getItem(userKey) || '{}');

      setUserData(prev => ({
        ...prev,
        fullName: savedProfile.fullName || user.displayName || prev.fullName,
        email: user.email || prev.email,
        profileImage: savedProfile.profileImage || user.photoURL || prev.profileImage
      }));

      // Fetch bookings
      unsubscribeBookings = bookingService.getUserBookings(user.uid, (data) => {
        console.log("Profile: Received bookings (Firestore)", data.length);
        setBookings(data);
      });

      // Fetch Purchases (Orders)
      const fetchPurchases = async () => {
        try {
          const data = await bookingService.getUserOrders(user.uid);
          setPurchases(data);
        } catch (error) {
          console.error("Error fetching purchases:", error);
        }
      };
      fetchPurchases();
    };

    // Listen to Auth state
    const unsubscribeAuth = authService.onAuthStateChange((user) => {
      syncUserData(user);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
    };
  }, []);

  const handleEditProfile = () => setEditMode(true);
  
  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
      if (user) {
        const userKey = `user_profile_${user.uid || 'mock_user_id'}`;
        const profileData = {
          ...userData,
          profileImage: userData.profileImage, // Ensure image is kept
          lastUpdated: new Date().toISOString()
        };
        
        sessionStorage.setItem(userKey, JSON.stringify(profileData));
        
        // 2. Update Firestore if authenticated
        if (authService.getCurrentUser()) {
          try {
            await authService.updateUserDoc(user.uid, {
              fullName: userData.fullName,
              phone: userData.phone,
              address: userData.address
            });
          } catch (err) {
            console.warn("Could not update Firestore doc:", err);
          }
        }
        
        // Trigger sync with Navbar
        window.dispatchEvent(new Event('profileUpdate'));
        
        setEditMode(false);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setShowAdjustModal(true);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAdjustedImage = () => {
    setLoading(true);
    
    // Create a canvas to crop the image based on zoom and offset
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = async () => {
      try {
        const size = 300; // Final image size
        canvas.width = size;
        canvas.height = size;
        
        // Calculate drawing parameters
        const aspect = img.width / img.height;
        let drawW, drawH;
        
        if (aspect > 1) {
          drawH = size * zoom;
          drawW = drawH * aspect;
        } else {
          drawW = size * zoom;
          drawH = drawW / aspect;
        }
        
        const drawX = (size / 2) - (drawW / 2) + (offset.x * (size / 256) * zoom);
        const drawY = (size / 2) - (drawH / 2) + (offset.y * (size / 256) * zoom);
        
        // Draw to canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        
        const finalImage = canvas.toDataURL('image/jpeg', 0.8);
        
        // 1. Update Local State
        setUserData(prev => ({ ...prev, profileImage: finalImage }));
        
        // 2. Update Session Storage (for Demo persistence)
        const user = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
        if (user) {
          const userKey = `user_profile_${user.uid || 'mock_user_id'}`;
          const profileData = JSON.parse(sessionStorage.getItem(userKey) || '{}');
          profileData.profileImage = finalImage;
          profileData.fullName = userData.fullName; // Sync name too
          sessionStorage.setItem(userKey, JSON.stringify(profileData));
          
          // 3. Update Firebase Profile & Doc (if truly authenticated)
          if (authService.getCurrentUser()) {
            try {
              await authService.updateUserProfile({ photoURL: finalImage });
              await authService.updateUserDoc(user.uid, { profileImage: finalImage });
            } catch (err) {
              console.warn("Could not update Firebase profile, using session fallback", err);
            }
          }
        }

        // Trigger a custom event to notify the Navbar to refresh its user data
        window.dispatchEvent(new Event('profileUpdate'));

        setShowAdjustModal(false);
        toast.success('Profile image updated');
      } catch (err) {
        console.error("Error saving image:", err);
        toast.error("Failed to save image");
      } finally {
        setLoading(false);
      }
    };
    img.onerror = () => {
      setLoading(false);
      toast.error("Failed to load image for editing");
    };
    img.src = tempImage;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getProfileCompletion = () => {
    let completed = 0;
    const fields = [userData.fullName, userData.email, userData.phone, userData.address.city, userData.address.state];
    fields.forEach(f => { if (f) completed++; });
    return Math.round((completed / fields.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center">
              <div className="relative inline-block mb-6">
                <img 
                  src={userData.profileImage} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl" 
                  alt="" 
                />
                <label className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <CameraIcon className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{userData.fullName}</h2>
              <p className="text-sm text-gray-400 font-medium mt-1">{userData.email}</p>
              
              <div className="mt-8 pt-8 border-t border-gray-50 space-y-3">
                <button 
                  onClick={() => navigate('/user/home')}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-gray-50 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Main Home</span>
                </button>
                <button 
                  onClick={() => authService.logout()}
                  className="w-full flex items-center justify-center space-x-3 p-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completion</span>
                <span className="text-sm font-bold text-primary-600">{getProfileCompletion()}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: `${getProfileCompletion()}%` }} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-3xl p-2 border border-gray-100 shadow-sm flex overflow-x-auto no-scrollbar">
              {[
                { id: 'personal', label: 'Personal', icon: User },
                { id: 'purchases', label: 'Purchased Properties', icon: ShoppingBag },
                { id: 'bookings', label: 'Bookings', icon: Calendar },
                { id: 'saved', label: 'Saved', icon: Heart },
                { id: 'messages', label: 'Messages', icon: MessageSquare },
                { id: 'notifications', label: 'Alerts', icon: Bell },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'messages') {
                      navigate('/user/messages');
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-sm">
              {activeTab === 'personal' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                    {!editMode && (
                      <button onClick={handleEditProfile} className="flex items-center space-x-2 text-primary-600 font-bold hover:underline">
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  
                  {editMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                        <input 
                          type="text" 
                          value={userData.fullName}
                          onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                        <input 
                          type="text" 
                          value={userData.phone}
                          onChange={(e) => setUserData({...userData, phone: e.target.value})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Street Address</label>
                        <input 
                          type="text" 
                          value={userData.address.street}
                          onChange={(e) => setUserData({...userData, address: {...userData.address, street: e.target.value}})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Street Address"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Building / Flat Name</label>
                        <input 
                          type="text" 
                          value={userData.address.buildingName}
                          onChange={(e) => setUserData({...userData, address: {...userData.address, buildingName: e.target.value}})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Building or Flat Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">City</label>
                        <input 
                          type="text" 
                          value={userData.address.city}
                          onChange={(e) => setUserData({...userData, address: {...userData.address, city: e.target.value}})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">State</label>
                        <input 
                          type="text" 
                          value={userData.address.state}
                          onChange={(e) => setUserData({...userData, address: {...userData.address, state: e.target.value}})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Pincode</label>
                        <input 
                          type="text" 
                          value={userData.address.pincode}
                          onChange={(e) => setUserData({...userData, address: {...userData.address, pincode: e.target.value}})}
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                      </div>
                      <div className="md:col-span-2 flex space-x-4 pt-4">
                        <button 
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all flex items-center"
                        >
                          {loading ? <Clock className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                          Save Changes
                        </button>
                        <button 
                          onClick={() => setEditMode(false)}
                          className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Full Name</p>
                        <p className="text-lg font-bold text-gray-900">{userData.fullName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Email Address</p>
                        <p className="text-lg font-bold text-gray-900">{userData.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Phone Number</p>
                        <p className="text-lg font-bold text-gray-900">{userData.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Street Address</p>
                        <p className="text-lg font-bold text-gray-900">{userData.address.street || 'address '}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Building, City & State</p>
                        <p className="text-lg font-bold text-gray-900">
                          {[userData.address.buildingName, userData.address.city, userData.address.state].filter(Boolean).join(', ') || 'Not set'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Pincode</p>
                        <p className="text-lg font-bold text-gray-900">{userData.address.pincode || ' '}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-400 uppercase">Country</p>
                        <p className="text-lg font-bold text-gray-900">{userData.address.country}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
                  {bookings.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {bookings.map(booking => (
                        <div key={booking.id} className="flex items-center space-x-6 p-4 rounded-2xl border border-gray-50 hover:border-gray-200 transition-colors">
                          <img src={booking.propertyImage} className="w-24 h-24 rounded-2xl object-cover" alt="" />
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{booking.propertyName}</h3>
                            <p className="text-sm text-gray-400 font-medium">{booking.location}</p>
                            <div className="flex items-center space-x-4 mt-3">
                              <span className="px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-lg">{booking.bookingStatus || 'Pending'}</span>
                              <span className="text-xs text-gray-400 font-bold">{booking.bookingDate}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <Calendar className="w-16 h-16 text-gray-100 mx-auto" />
                      <p className="text-gray-400 font-bold">No property bookings found</p>
                      <button onClick={() => navigate('/user/home')} className="text-primary-600 font-bold hover:underline">Explore properties</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'purchases' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Purchased Properties</h2>
                    <span className="px-4 py-1 bg-green-50 text-green-600 text-xs font-black rounded-full uppercase tracking-widest">
                      {purchases.length} Properties
                    </span>
                  </div>

                  {purchases.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {purchases.map(purchase => (
                        <div key={purchase.id} className="group relative bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-gray-200 transition-all">
                          <div className="flex flex-col md:flex-row md:items-center gap-8">
                            <div className="relative w-full md:w-48 h-48 md:h-32 rounded-2xl overflow-hidden shrink-0">
                              <img 
                                src={purchase.propertyInfo?.image || purchase.propertyImage} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                alt="" 
                              />
                              <div className="absolute top-2 right-2 px-3 py-1 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold rounded-lg">
                                Verified Purchase
                              </div>
                            </div>

                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-black text-gray-900">{purchase.propertyInfo?.name || purchase.propertyName}</h3>
                                  <p className="text-gray-400 font-bold flex items-center mt-1">
                                    <MapPin className="w-3.5 h-3.5 mr-1 text-primary-500" />
                                    {purchase.propertyInfo?.location?.city || purchase.location}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                                  <p className="text-sm font-mono font-bold text-gray-900">#{purchase.id.slice(-8).toUpperCase()}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-50">
                                <div className="flex items-center space-x-2">
                                  <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                    <PaymentIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Paid Amount</p>
                                    <p className="text-sm font-black text-primary-600 italic">₹{purchase.paymentInfo?.amount?.toLocaleString('en-IN') || purchase.price?.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                    <CheckCircle className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
                                    <p className="text-sm font-black text-green-600 uppercase tracking-wider">{purchase.orderStatus || 'Completed'}</p>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <div className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                                    <Clock className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">Date</p>
                                    <p className="text-sm font-bold text-gray-700">
                                      {new Date(purchase.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center space-y-6">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-gray-200">
                        <ShoppingBag className="w-12 h-12 text-gray-200" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-bold text-gray-900">No properties purchased yet</p>
                        <p className="text-gray-400 font-medium">When you purchase a property, it will appear here for tracking.</p>
                      </div>
                      <button 
                        onClick={() => navigate('/user/home')} 
                        className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all"
                      >
                        Start Exploring
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Saved Properties</h2>
                  <div className="py-20 text-center space-y-4">
                    <Heart className="w-16 h-16 text-gray-100 mx-auto" />
                    <p className="text-gray-400 font-bold">Your wishlist is empty</p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h2>
                  <div className="py-20 text-center space-y-4">
                    <Bell className="w-16 h-16 text-gray-100 mx-auto" />
                    <p className="text-gray-400 font-bold">All caught up!</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
                  <div className="space-y-4">
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <Lock className="w-5 h-5 text-gray-400" />
                        <span className="font-bold text-gray-700">Change Password</span>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-300 rotate-180" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-colors text-red-500">
                      <div className="flex items-center space-x-4">
                        <Trash2 className="w-5 h-5" />
                        <span className="font-bold">Delete Account</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Image Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAdjustModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full space-y-8 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Adjust Photo</h3>
              <p className="text-sm text-gray-400 font-medium">Drag to reposition and use slider to zoom</p>
            </div>

            <div 
              className="relative w-64 h-64 mx-auto rounded-full border-4 border-gray-100 shadow-inner overflow-hidden cursor-move bg-gray-50"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <img
                src={tempImage}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}
                alt=""
              />
              <div className="absolute inset-0 pointer-events-none border-[20px] border-black/10 rounded-full" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => setShowAdjustModal(false)} 
                  className="py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAdjustedImage}
                  disabled={loading}
                  className="py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center"
                >
                  {loading ? <Clock className="w-5 h-5 animate-spin" /> : 'Save Photo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center space-y-6 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <LogOut className="w-10 h-10 text-red-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Sign Out?</h3>
              <p className="text-gray-500 font-medium">Are you sure you want to log out of your account?</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowLogoutModal(false)} className="py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold">Cancel</button>
              <button onClick={() => authService.logout()} className="py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100">Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


