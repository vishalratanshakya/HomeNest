import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  IndianRupee, 
  FileText, 
  Image as ImageIcon,
  Check,
  ChevronLeft,
  Upload,
  Wifi,
  Wind,
  Car,
  Waves,
  Tv,
  Coffee,
  Shield,
  Zap,
  Trash2,
  X,
  Plus,
  Monitor,
  Briefcase,
  Flame,
  ChefHat,
  Dumbbell,
  Clock,
  Star,
  Calendar,
  Home,
  LayoutGrid,
  Layers,
  Armchair,
  UserCheck,
  Compass,
  Tag,
  Phone,
  Mail,
  Navigation,
  Bot,
  CheckCircle,
  ArrowLeft,
  Save
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import OwnerSidebar from '../components/OwnerSidebar';
import OwnerHeader from '../components/OwnerHeader';
import LocationSelector from '../components/LocationSelector';
import toast from 'react-hot-toast';
import { firestoreService, cloudinaryService, authService } from '@core/services/firebaseService';
import { useCategories } from '@core/contexts/CategoryContext';
import NewCategoryModal from '../components/NewCategoryModal';

export default function EditProperty({ hideLayout: propHideLayout = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Detect if user is admin to automatically hide layout
  const user = JSON.parse(sessionStorage.getItem('currentUser'));
  const hideLayout = propHideLayout || user?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mainImage, setMainImage] = useState('');
  const [subImages, setSubImages] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { categories } = useCategories();

  const [formData, setFormData] = useState({
    listingType: 'sell', // sell, rent
    title: '',
    type: 'Apartment',
    shortDescription: '',
    description: '',
    bhk: '2 BHK',
    bedrooms: '',
    bathrooms: '',
    balconies: '',
    floorNumber: '',
    totalFloors: '',
    propertyAge: '',
    furnishing: 'Unfurnished',
    country: 'India',
    state: '',
    city: '',
    locality: '',
    address: '',
    pincode: '',
    landmark: '',
    // SELL
    totalPrice: '',
    pricePerSqFt: '',
    negotiable: 'No',
    // RENT
    monthlyRent: '',
    securityDeposit: '',
    maintenance: '',
    preferredTenants: 'Any',
    availableFrom: '',
    propertyStatus: 'Ready to Move',
    amenities: [],
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  useEffect(() => {
    const loadProperty = async () => {
      if (!id) return;
      try {
        setFetching(true);
        const data = await firestoreService.getProperty(id);
        if (data) {
          // Map stored data back to form state
          setFormData({
            listingType: data.listingType || data.category || 'sell',
            title: data.title || data.name || '',
            type: data.type || data.category || 'Apartment',
            shortDescription: data.shortDescription || '',
            description: data.description || '',
            bhk: data.bhk || '2 BHK',
            bedrooms: data.bedrooms || '',
            bathrooms: data.bathrooms || '',
            balconies: data.balconies || '',
            floorNumber: data.floorNumber || '',
            totalFloors: data.totalFloors || '',
            propertyAge: data.propertyAge || '',
            furnishing: data.furnishing || 'Unfurnished',
            country: data.location?.country || data.country || 'India',
            state: data.location?.state || data.state || '',
            city: data.location?.city || data.city || '',
            locality: data.location?.locality || data.locality || '',
            address: data.location?.address || data.address || '',
            pincode: data.pincode || '',
            landmark: data.landmark || '',
            totalPrice: data.totalPrice || (data.listingType === 'sell' ? data.price : '') || '',
            pricePerSqFt: data.pricePerSqFt || '',
            negotiable: data.negotiable || 'No',
            monthlyRent: data.monthlyRent || (data.listingType === 'rent' ? data.price : '') || '',
            securityDeposit: data.securityDeposit || '',
            maintenance: data.maintenance || '',
            preferredTenants: data.preferredTenants || 'Any',
            availableFrom: data.availableFrom || '',
            availableNow: data.availableNow || false,
            propertyStatus: data.propertyStatus || 'Ready to Move',
            amenities: data.amenities || [],
            contactName: data.ownerName || data.contactName || '',
            contactPhone: data.ownerPhone || data.contactPhone || '',
            contactEmail: data.contactEmail || ''
          });
          setMainImage(data.mainImage || '');
          setSubImages(data.subImages || data.images?.slice(1) || []);
        } else {
          toast.error('Property not found');
          navigate('/owner/properties');
        }
      } catch (error) {
        console.error('Error loading property:', error);
        toast.error('Failed to load property details');
      } finally {
        setFetching(false);
      }
    };

    loadProperty();
  }, [id, navigate]);

  const amenitiesGroups = [
    {
      name: '🏠 Basic',
      list: [
        { id: 'WiFi', icon: Wifi },
        { id: 'Parking', icon: Car },
        { id: 'Security', icon: Shield },
        { id: 'Elevator', icon: Building2 },
      ]
    },
    {
      name: '🍳 Lifestyle',
      list: [
        { id: 'Gym', icon: Dumbbell },
        { id: 'Swimming Pool', icon: Waves },
        { id: 'Workspace', icon: Briefcase },
        { id: 'Fireplace', icon: Flame },
      ]
    },
    {
      name: '🧼 Utility',
      list: [
        { id: 'Washing Machine', icon: Zap },
        { id: 'Hot Water', icon: Zap },
        { id: 'Kitchen', icon: ChefHat },
        { id: 'TV', icon: Tv },
      ]
    },
    {
      name: '🐾 Special',
      list: [
        { id: 'Pet Friendly', icon: Star },
        { id: 'Other', icon: Plus },
      ]
    }
  ];

  const handleLocationChange = (location) => {
    setFormData(prev => ({
      ...prev,
      country: location.country,
      state: location.state,
      city: location.city
    }));
  };

  const toggleAmenity = (id) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id) 
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id]
    }));
  };

  const removeSubImage = (index) => {
    setSubImages(subImages.filter((_, i) => i !== index));
  };

  const removeMainImage = () => {
    setMainImage('');
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const uploadToast = toast.loading('Uploading main image...');
    
    try {
      const result = await cloudinaryService.uploadImage(file);
      setMainImage(result.url);
      toast.success('Main image uploaded successfully', { id: uploadToast });
    } catch (error) {
      toast.error('Main image upload failed', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleSubImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setUploading(true);
    const uploadToast = toast.loading('Uploading images...');
    
    try {
      const uploadPromises = files.map(file => cloudinaryService.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.url);
      setSubImages(prev => [...prev, ...urls]);
      toast.success('Sub images uploaded successfully', { id: uploadToast });
    } catch (error) {
      toast.error('Sub images upload failed', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainImage && subImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    
    setLoading(true);
    
    try {
      const price = formData.listingType === 'sell' ? formData.totalPrice : formData.monthlyRent;

      const propertyData = {
        ...formData,
        price: Number(price.toString().replace(/[^0-9.]/g, '')),
        mainImage: mainImage,
        images: [mainImage, ...subImages].filter(img => img),
        subImages: subImages,
        status: 'active',
        category: formData.listingType,
        location: {
          city: formData.city,
          address: formData.address,
          locality: formData.locality,
          state: formData.state,
          country: formData.country
        }
      };

      await firestoreService.updateProperty(id, propertyData);
      toast.success('Property updated successfully!');
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    const loadingUI = (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] px-6 text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Property Details...</p>
      </div>
    );

    if (hideLayout) return loadingUI;

    return (
      <div className="flex min-h-screen bg-gray-100">
        <OwnerSidebar />
        <main className="flex-1 lg:ml-72 ml-0 min-h-screen bg-gray-50/50 transition-all duration-300 w-full overflow-x-hidden">
          <OwnerHeader />
          {loadingUI}
        </main>
      </div>
    );
  }

  const content = (
    <div className="px-3 sm:px-6 lg:px-10 py-6 w-full">
      {/* Breadcrumbs & Title */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => hideLayout ? navigate(-1) : navigate('/owner/properties')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-all group shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Edit Property</h1>
            <p className="text-slate-500 text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-widest">
              {hideLayout ? 'Administrative Control Mode' : 'Update your listing in the network'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-full sm:w-auto">
          {[
            { id: 'sell', label: 'Sell', icon: Tag },
            { id: 'rent', label: 'Rent', icon: IndianRupee },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setFormData({...formData, listingType: type.id})}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shrink-0 ${
                formData.listingType === type.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-all border-l border-gray-100 shrink-0 group"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
            Category
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h3 className="section-title">
              Basic Information
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="label">Property Title <span className="text-rose-500">*</span></label>
                <input 
                  type="text" required placeholder="e.g. 3BHK Luxury Apartment in Mumbai"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="label">Property Type <span className="text-rose-500">*</span></label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="input"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Furnishing <span className="text-rose-500">*</span></label>
                  <select 
                    value={formData.furnishing}
                    onChange={(e) => setFormData({...formData, furnishing: e.target.value})}
                    className="input"
                  >
                    <option>Unfurnished</option>
                    <option>Semi-Furnished</option>
                    <option>Furnished</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">Short Description <span className="text-rose-500">*</span></label>
                <input 
                  type="text" required
                  placeholder="A catchy one-liner for your property..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  className="input"
                />
              </div>

              <div className="space-y-2">
                <label className="label">Description <span className="text-rose-500">*</span></label>
                <textarea 
                  rows="5" required
                  placeholder="Describe your property features..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input"
                ></textarea>
              </div>
            </div>
          </motion.div>

          {/* Property Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="section-title">
              Property Details
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="space-y-2">
                  <label className="label">BHK Type <span className="text-rose-500">*</span></label>
                  <select 
                    value={formData.bhk}
                    onChange={(e) => setFormData({...formData, bhk: e.target.value})}
                    className="input"
                  >
                    <option>1 BHK</option>
                    <option>2 BHK</option>
                    <option>3 BHK</option>
                    <option>4 BHK</option>
                    <option>5+ BHK</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="label">Bedrooms <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" required
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({...formData, bedrooms: e.target.value})}
                    className="input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Bathrooms <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" required
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({...formData, bathrooms: e.target.value})}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="space-y-2">
                  <label className="label">Balconies</label>
                  <input 
                    type="text"
                    value={formData.balconies}
                    onChange={(e) => setFormData({...formData, balconies: e.target.value})}
                    placeholder="e.g. 1"
                    className="input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Floor No.</label>
                  <input 
                    type="text"
                    value={formData.floorNumber}
                    onChange={(e) => setFormData({...formData, floorNumber: e.target.value})}
                    placeholder="e.g. 2"
                    className="input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Total Floors</label>
                  <input 
                    type="text"
                    value={formData.totalFloors}
                    onChange={(e) => setFormData({...formData, totalFloors: e.target.value})}
                    placeholder="e.g. 15"
                    className="input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Property Age</label>
                  <input 
                    type="text"
                    value={formData.propertyAge}
                    onChange={(e) => setFormData({...formData, propertyAge: e.target.value})}
                    placeholder="e.g. 5 Years"
                    className="input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Status <span className="text-rose-500">*</span></label>
                  <select 
                    required
                    value={formData.propertyStatus}
                    onChange={(e) => setFormData({...formData, propertyStatus: e.target.value})}
                    className="input"
                  >
                    <option value="">Select Status</option>
                    <option value="Ready to Move">Ready to Move</option>
                    <option value="Under Construction">Under Construction</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="section-title">
              Location Details
            </h3>
            <div className="space-y-6">
              <LocationSelector 
                onChange={handleLocationChange} 
                initialData={{ 
                  country: formData.country, 
                  state: formData.state, 
                  city: formData.city 
                }} 
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="label">Locality / Area <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required
                    value={formData.locality}
                    onChange={(e) => setFormData({...formData, locality: e.target.value})}
                    className="input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Landmark</label>
                  <input 
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({...formData, landmark: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="label">Address <span className="text-rose-500">*</span></label>
                  <textarea 
                    rows="1" required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="input"
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="label">Pincode <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required
                    value={formData.pincode}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value})}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pricing Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="section-title">
              {formData.listingType === 'sell' ? 'Pricing Details' : 'Rental Details'}
            </h3>
            
            <div className="space-y-6">
              {formData.listingType === 'sell' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="label">Total Price (₹) <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" required
                        value={formData.totalPrice}
                        onChange={(e) => setFormData({...formData, totalPrice: e.target.value})}
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Price per Sq Ft</label>
                      <input 
                        type="text"
                        value={formData.pricePerSqFt}
                        onChange={(e) => setFormData({...formData, pricePerSqFt: e.target.value})}
                        className="input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="label">Negotiable?</label>
                    <select 
                      value={formData.negotiable}
                      onChange={(e) => setFormData({...formData, negotiable: e.target.value})}
                      className="input"
                    >
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.listingType === 'rent' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="label">Monthly Rent (₹) <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" required
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({...formData, monthlyRent: e.target.value})}
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Security Deposit (₹) <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" required
                        value={formData.securityDeposit}
                        onChange={(e) => setFormData({...formData, securityDeposit: e.target.value})}
                        className="input"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="label">Maintenance Charges</label>
                      <input 
                        type="text"
                        value={formData.maintenance}
                        onChange={(e) => setFormData({...formData, maintenance: e.target.value})}
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Preferred Tenants</label>
                      <select 
                        value={formData.preferredTenants}
                        onChange={(e) => setFormData({...formData, preferredTenants: e.target.value})}
                        className="input"
                      >
                        <option>Any</option>
                        <option>Family</option>
                        <option>Bachelor</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="label">Availability From</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="date"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({...formData, availableFrom: e.target.value})}
                      className="input"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-2 text-nowrap">
                    <input 
                      type="checkbox"
                      id="availableNowEdit"
                      checked={formData.availableFrom === new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        if(e.target.checked) {
                          setFormData({...formData, availableFrom: new Date().toISOString().split('T')[0]});
                        } else {
                          setFormData({...formData, availableFrom: ''});
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="availableNowEdit" className="text-xs font-bold text-gray-500 uppercase">Available for now</label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Amenities */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h3 className="section-title">
              Amenities
            </h3>
            <div className="space-y-8">
              {amenitiesGroups.map((group) => (
                <div key={group.name}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{group.name}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {group.list.map((amenity) => (
                      <label 
                        key={amenity.id}
                        className={`flex items-center gap-2 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-all ${formData.amenities.includes(amenity.id) ? 'bg-indigo-50 border-indigo-200' : 'border-gray-200'}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={formData.amenities.includes(amenity.id)}
                          onChange={() => toggleAmenity(amenity.id)}
                          className="accent-indigo-600 w-4 h-4" 
                        />
                        <span className={`text-sm font-medium ${formData.amenities.includes(amenity.id) ? 'text-indigo-700' : 'text-gray-700'}`}>
                          {amenity.id}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h3 className="section-title">
              Contact Information
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="label">Contact Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" required
                  value={formData.contactName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z\s]*$/.test(val)) {
                      setFormData({...formData, contactName: val});
                    }
                  }}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="label">Phone Number <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" required
                    value={formData.contactPhone}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9+\-\s]*$/.test(val)) {
                        setFormData({...formData, contactPhone: val});
                      }
                    }}
                    className="input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="label">Email Address <span className="text-rose-500">*</span></label>
                  <input 
                    type="email" required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Images */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="section-title mb-2">Property Images</h3>
          <p className="text-sm font-medium text-gray-500 mb-8">Update your property photos</p>
          
          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Main Image</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className={`aspect-[4/3] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer relative group ${mainImage ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleMainImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  {mainImage ? (
                    <div className="relative w-full h-full p-2">
                      <img src={mainImage} className="w-full h-full object-cover rounded-xl" alt="Main" />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); removeMainImage(); }}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-8 h-8 text-indigo-600 mb-2" />
                      <p className="text-[10px] font-bold text-gray-900 uppercase">Change Main</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Gallery Images</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <label className="aspect-[4/3] border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-all cursor-pointer relative group">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={handleSubImagesUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <Plus className="w-6 h-6 text-indigo-600 mb-1" />
                  <p className="text-[10px] font-bold text-gray-900 uppercase">Add Photos</p>
                </label>

                <AnimatePresence>
                  {subImages.map((img, idx) => (
                    <motion.div
                      key={img + idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative aspect-[4/3] group rounded-2xl overflow-hidden"
                    >
                      <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                      <button
                        type="button"
                        onClick={() => removeSubImage(idx)}
                        className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => hideLayout ? navigate(-1) : navigate('/owner/properties')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-10"
          >
            {loading ? (
              <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5 fill-white" />
            )}
            Save Changes
          </button>
        </div>
      </form>

      <NewCategoryModal 
        isOpen={showCategoryModal} 
        onClose={() => setShowCategoryModal(false)} 
      />

      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => hideLayout ? navigate(-1) : navigate('/owner/properties')}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl overflow-hidden max-w-md w-full p-10 text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Updated!</h2>
              <p className="text-slate-500 font-medium mb-10">Your property details have been successfully updated.</p>
              
              <button 
                onClick={() => hideLayout ? navigate(-1) : navigate('/owner/properties')}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm tracking-tight hover:bg-indigo-700 transition-all shadow-lg"
              >
                {hideLayout ? 'Back to Dashboard' : 'Back to Properties'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  if (hideLayout) return content;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <OwnerSidebar />
      <main className="flex-1 lg:ml-72 ml-0 min-h-screen bg-gray-50/50 transition-all duration-300 w-full overflow-x-hidden">
        <OwnerHeader />
        {content}
      </main>
    </div>
  );
}
