import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Camera, 
  ShieldCheck,
  Save,
  Globe,
  Briefcase,
  ZoomIn,
  ZoomOut,
  Plus,
  Minus
} from 'lucide-react';
import VendorSidebar from '../components/VendorSidebar';
import VendorHeader from '../components/VendorHeader';
import LocationSelector from '../components/LocationSelector';
import toast from 'react-hot-toast';
import { authService, firestoreService, cloudinaryService } from '../../src/core/services/firebaseService';

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser')));
  const [propertyCount, setPropertyCount] = useState(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || '');
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
    agencyName: '',
    businessType: '',
    address: '',
    bio: '',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai'
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((user) => {
      if (user) {
        setCurrentUser(user);
        setPhotoURL(user.photoURL || '');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchUserData = async () => {
      const userDoc = await firestoreService.getUserDocument(currentUser.uid);
      if (userDoc) {
        setFormData(prev => ({
          ...prev,
          displayName: userDoc.displayName || userDoc.name || currentUser.displayName || '',
          email: userDoc.email || currentUser.email || '',
          phoneNumber: userDoc.phoneNumber || userDoc.phone || currentUser.phoneNumber || '',
          agencyName: userDoc.agencyName || '',
          businessType: userDoc.businessType || '',
          address: userDoc.address || '',
          bio: userDoc.bio || '',
          country: userDoc.country || 'India',
          state: userDoc.state || 'Maharashtra',
          city: userDoc.city || 'Mumbai'
        }));
        if (userDoc.photoURL) {
          setPhotoURL(userDoc.photoURL);
        }
      }
    };
    fetchUserData();
    
    // Fetch real property count
    const unsubscribe = firestoreService.subscribeToProperties(
      {},
      (data) => {
        const filtered = data.filter(
          (p) => p.vendorId === currentUser.uid || p.vendorRole === 'admin' || p.vendorId === 'admin'
        );
        setPropertyCount(filtered.length);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const loadingToast = toast.loading('Uploading profile image...');
    
    try {
      // Upload to Cloudinary
      const result = await cloudinaryService.uploadImage(file, {
        folder: 'profile_images'
      });

      // Update Firebase Auth Profile
      await authService.updateUserProfile({
        photoURL: result.url
      });

      // Update Firestore User Document
      await firestoreService.updateUserDocument(currentUser.uid, {
        photoURL: result.url,
        updatedAt: new Date().toISOString()
      });

      setPhotoURL(result.url);
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('user-profile-updated', { 
        detail: { ...currentUser, photoURL: result.url } 
      }));

      toast.success('Profile image updated!', { id: loadingToast });
      
      // Force a re-fetch of user data or just reload to show new image
      // Since it's linked to user?.photoURL which comes from authService.getCurrentUser()
      // we might need to trigger a state update if the header/sidebar don't reactive automatically
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image', { id: loadingToast });
    } finally {
      setImageUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    const loadingToast = toast.loading('Updating profile...');
    try {
      await firestoreService.updateUserDocument(currentUser.uid, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      await authService.updateUserProfile({
        displayName: formData.displayName
      });

      // Notify other components
      window.dispatchEvent(new CustomEvent('user-profile-updated', { 
        detail: { ...currentUser, displayName: formData.displayName } 
      }));

      toast.success('Profile updated successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <VendorSidebar />
      <main className="flex-1 lg:ml-72 ml-0 min-h-screen bg-slate-50/50 transition-all duration-300">
        <VendorHeader />
        
        <div className="px-4 sm:px-6 lg:px-10 py-6">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
            <p className="text-gray-500 text-sm font-medium mt-1">Manage your profile and business identity</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar / Profile Card */}
            <div className="lg:col-span-4 space-y-8">
              <div className="card !p-8 overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-32 bg-indigo-600"></div>
                <div className="relative flex flex-col items-center">
                  <div className="relative mt-8 group/avatar">
                    {/* Professional Circular Frame */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl relative bg-gray-100 flex items-center justify-center mx-auto">
                      {imageUploading ? (
                        <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                      ) : (
                        <motion.img 
                          src={photoURL ? cloudinaryService.optimizeUrl(photoURL, { width: 600, height: 600, crop: 'fill' }) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.displayName || 'Vendor'}`} 
                          alt="Profile" 
                          drag={scale > 1}
                          dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
                          dragElastic={0.1}
                          animate={{ scale }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          style={{
                            objectPosition: "center center",
                            cursor: scale > 1 ? 'grab' : 'default'
                          }}
                          whileTap={{ cursor: scale > 1 ? 'grabbing' : 'default' }}
                          className="w-full h-full object-cover transition-opacity duration-300"
                        />
                      )}
                    </div>

                    {/* Zoom Controls */}
                    {!imageUploading && photoURL && (
                      <div className="absolute -bottom-1 -right-1 flex gap-1 bg-white/90 backdrop-blur-lg rounded-xl shadow-lg p-1.5 border border-gray-100 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 scale-90 group-hover/avatar:scale-100">
                        <button 
                          onClick={() => setScale(prev => Math.max(prev - 0.1, 1))}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-gray-200 self-center mx-0.5" />
                        <button 
                          onClick={() => setScale(prev => Math.min(prev + 0.1, 2.5))}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-indigo-600 transition-colors"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                    className="mt-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl px-6 py-2.5 text-sm font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {photoURL ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  
                  <div className="text-center mt-6">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{currentUser?.displayName || 'Vendor'}</h2>
                    <p className="text-indigo-600 text-xs font-bold uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Verified Vendor
                    </p>
                  </div>

                  <div className="w-full mt-10 grid grid-cols-2 gap-4 border-t border-gray-50 pt-8 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{propertyCount}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Properties</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">4.9</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rating</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="card !p-4 space-y-2">
                {[
                  { id: 'personal', label: 'Personal Info', icon: User },
                  { id: 'business', label: 'Business Profile', icon: Building },
                  { id: 'security', label: 'Security', icon: ShieldCheck },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                        : 'text-gray-400 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="lg:col-span-8">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card !p-4 sm:!p-6 lg:!p-10"
              >
                <form onSubmit={handleUpdate} className="space-y-10">
                  {activeTab === 'personal' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="label">Full Name</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                              <User className="w-5 h-5" />
                            </div>
                            <input 
                              type="text" 
                              value={formData.displayName} 
                              onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                              className="input pl-12" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="label">Email Address</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                              <Mail className="w-5 h-5" />
                            </div>
                            <input 
                              type="email" 
                              value={formData.email} 
                              readOnly
                              className="input pl-12 bg-gray-50 cursor-not-allowed" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="label">Phone Number</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                              <Phone className="w-5 h-5" />
                            </div>
                            <input 
                              type="tel" 
                              value={formData.phoneNumber} 
                              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                              placeholder="+91 00000 00000"
                              className="input pl-12" 
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <LocationSelector 
                            onChange={(location) => setFormData({...formData, ...location})}
                            initialData={{ country: formData.country, state: formData.state, city: formData.city }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'business' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="label">Agency Name</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                              <Building className="w-5 h-5" />
                            </div>
                            <input 
                              type="text" 
                              value={formData.agencyName} 
                              onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                              className="input pl-12" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="label">Business Type</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <input 
                              type="text" 
                              value={formData.businessType} 
                              onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                              className="input pl-12" 
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="label">Business Address</label>
                          <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <input 
                              type="text" 
                              value={formData.address} 
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              placeholder="Business physical address"
                              className="input pl-12" 
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="label">Business Bio</label>
                          <textarea 
                            rows="4"
                            className="input min-h-[120px] resize-none"
                            value={formData.bio}
                            onChange={(e) => setFormData({...formData, bio: e.target.value})}
                            placeholder="Tell potential clients about your agency..."
                          ></textarea>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-8 border-t border-gray-50 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary flex items-center gap-3 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Update Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

