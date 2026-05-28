import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, ArrowLeft, Loader2, User, Mail, Phone, MapPin, Briefcase, Calendar, Heart } from 'lucide-react';
import { authService, firestoreService, cloudinaryService } from '@core/services/firebaseService';

import toast from 'react-hot-toast';
import './userDashboard.css';

export default function EditProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    accountType: 'User',
    memberSince: '',
    savedProperties: 0,
    propertyVisits: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (user) {
        setCurrentUser(user);
        const userDoc = await firestoreService.getUserDocument(user.uid);
        if (userDoc) {
          setFormData({
            fullName: userDoc.fullName || userDoc.name || user.displayName || '',
            email: userDoc.email || user.email || '',
            phone: userDoc.phone || '',
            location: userDoc.location || '',
            accountType: userDoc.accountType || 'User',
            memberSince: userDoc.memberSince || new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            savedProperties: userDoc.savedProperties || 0,
            propertyVisits: userDoc.propertyVisits || 0
          });
          setProfileImage(userDoc.profileImage || user.photoURL || null);
        } else {
          setFormData(prev => ({
            ...prev,
            fullName: user.displayName || '',
            email: user.email || '',
            memberSince: new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          }));
          setProfileImage(user.photoURL || null);
        }
      } else {
        navigate('/auth/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      let imageUrl = profileImage;
      if (imageFile) {
        const result = await cloudinaryService.uploadImage(imageFile);
        imageUrl = result.url;
      }
      const updateData = {
        ...formData,
        profileImage: imageUrl,
        photoURL: imageUrl,
        displayName: formData.fullName,
        name: formData.fullName
      };
      await firestoreService.updateUserDocument(currentUser.uid, updateData);
      await authService.updateUserProfile({
        displayName: formData.fullName,
        photoURL: imageUrl
      });
      // Broadcast the updated profile so sidebar/navbar refresh immediately
      window.dispatchEvent(new CustomEvent('user-profile-updated', {
        detail: {
          uid: currentUser.uid,
          displayName: formData.fullName,
          photoURL: imageUrl,
          name: formData.fullName
        }
      }));
      toast.success('Profile updated successfully!');
      navigate('/user/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full px-4 sm:px-6 lg:px-6 pt-2 md:pt-8 pb-8">
        {/* Header with Breadcrumb */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/user/profile')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-[2px] mb-3 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </button>
          <div className="flex items-end justify-between border-b border-gray-100 pb-5">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">Account Settings</h1>
              <p className="text-slate-600 font-medium text-lg">Manage your personal information and profile appearance.</p>
            </div>
            <div className="hidden md:flex items-center gap-4">
                <div className="text-right">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Last Updated</p>
                    <p className="text-sm font-bold text-slate-900">Today, 12:45 PM</p>
                </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: PROFILE IMAGE */}
          <div className="lg:col-span-3">
            <div className="dashboard-card sticky top-32 overflow-hidden">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 h-32 -mx-10 -mt-10 mb-20 relative">
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                        <div 
                            className="relative group overflow-hidden rounded-full border-[6px] border-white shadow-2xl"
                        >
                            <div className="w-40 h-40 bg-white select-none pointer-events-none">
                                <img 
                                    src={profileImage || 'https://i.pravatar.cc/150?u=' + currentUser?.uid} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label 
                                className="absolute bottom-2 right-2 w-12 h-12 bg-white text-indigo-600 rounded-full shadow-xl flex items-center justify-center cursor-pointer hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110 active:scale-95 border-2 border-indigo-50 z-10"
                            >
                                <Camera className="w-5 h-5" />
                                <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="text-center px-4 pb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-1">{formData.fullName || 'Member Name'}</h3>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">{formData.accountType}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Properties</p>
                            <p className="text-xl font-black text-slate-900">{formData.savedProperties}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Visits</p>
                            <p className="text-xl font-black text-slate-900">{formData.propertyVisits}</p>
                        </div>
                    </div>


                </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FORM INFO */}
          <div className="lg:col-span-9">
            <div className="dashboard-card h-full">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-50">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <User className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Basic Information</h2>
                    <p className="text-sm font-medium text-slate-400">Update your basic profile information and contact details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-[2px] ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="input-field !pl-12" 
                            placeholder="John Doe"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-[2px] ml-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="input-field !pl-12 bg-gray-50/50 text-slate-400" 
                            disabled
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-[2px] ml-1">Phone Number</label>
                    <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="input-field !pl-12" 
                            placeholder="+91 98765 43210"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-[2px] ml-1">Location</label>
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            className="input-field !pl-12" 
                            placeholder="Mumbai, India"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-[2px] ml-1">Account Type</label>
                    <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleInputChange}
                            className="input-field !pl-12" 
                            placeholder="Standard User"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-900 uppercase tracking-[2px] ml-1">Member Since</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input 
                            type="text" 
                            name="memberSince"
                            value={formData.memberSince}
                            onChange={handleInputChange}
                            className="input-field !pl-12 bg-gray-50/50 text-slate-400" 
                            disabled
                        />
                    </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-50">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 save-btn bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-3 py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      UPDATING SECURELY...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      SAVE CHANGES
                    </>
                  )}
                </button>
                <button 
                    onClick={() => navigate('/user/profile')}
                    className="px-10 py-5 bg-gray-50 text-slate-400 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-gray-100 hover:text-slate-900 transition-all active:scale-95"
                >
                    Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
