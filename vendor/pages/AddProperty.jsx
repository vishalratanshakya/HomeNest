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
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VendorSidebar from '../components/VendorSidebar';
import VendorHeader from '../components/VendorHeader';
import LocationSelector from '../components/LocationSelector';
import BulkImportModal from '../components/BulkImportModal';
import toast from 'react-hot-toast';
import { firestoreService, cloudinaryService, authService, db } from '@core/services/firebaseService';
import { notificationService } from '@core/services/notificationService';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useCategories } from '@core/contexts/CategoryContext';
import NewCategoryModal from '../components/NewCategoryModal';


export default function AddProperty() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mainImage, setMainImage] = useState('');
  const [subImages, setSubImages] = useState([]);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonImportType, setJsonImportType] = useState('sell');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastCreatedProperty, setLastCreatedProperty] = useState(null);
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
    amenities: ['WiFi', 'Air Conditioning', 'Security', 'Hot Water'],
    contactName: '',
    contactPhone: '',
    contactEmail: ''
  });

  // Fetch real user data for contact info
  useEffect(() => {
    const user = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactName: user.displayName || user.name || '',
        contactEmail: user.email || '',
        contactPhone: user.phoneNumber || user.phone || ''
      }));
    }
  }, []);

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
    const user = authService.getCurrentUser();
    console.log('Current user in AddProperty:', user);

    if (!user || !user.uid) {
      toast.error('Authentication error. Please login again.');
      setLoading(false);
      return;
    }

    try {
      // Create a URL slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\w ]+/g, '')
        .replace(/ +/g, '-');

      const price = formData.listingType === 'sell' ? formData.totalPrice : formData.monthlyRent;

      const propertyData = {
        ...formData,
        slug,
        price: Number(price.toString().replace(/[^0-9.]/g, '')),
        mainImage: mainImage,
        images: [mainImage, ...subImages].filter(img => img), // Backward compatibility + gallery
        subImages: subImages,
        vendorId: user?.uid || 'anonymous',
        vendorName: user?.displayName || formData.contactName,
        vendorPhone: formData.contactPhone,
        status: 'active',
        category: formData.type, // Map formData.type to category
        rating: 5.0,
        views: 0,
        leads: 0,
        location: {
          city: formData.city,
          address: formData.address,
          locality: formData.locality,
          state: formData.state,
          country: formData.country
        }
      };

      const propertyId = await firestoreService.createProperty(propertyData);

      // Send broadcast notification for new property
      try {
        await notificationService.createNotification({
          userId: 'all',
          title: 'New Property Launched!',
          message: `${formData.title} is now available in ${formData.city}.`,
          type: 'property_launch',
          propertyId: propertyId,
          image: mainImage
        });
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError);
      }

      toast.success('Property published successfully!');
      setLastCreatedProperty({ ...propertyData, id: propertyId });
      setShowSuccessModal(true);
      // navigate('/vendor/dashboard'); // Removed immediate navigate to show success card
    } catch (error) {
      console.error('Error publishing property:', error);
      toast.error('Failed to publish property');
    } finally {
      setLoading(false);
    }
  };

  // Bulk upload logic moved to BulkImportModal component

  return (
    <div className="flex min-h-screen bg-gray-100">
      <VendorSidebar />
      <main className="flex-1 lg:ml-72 ml-0 min-h-screen bg-gray-50/50 transition-all duration-300 w-full overflow-x-hidden">
        <VendorHeader />

        <div className="px-3 sm:px-6 lg:px-10 py-6 w-full">
          {/* Breadcrumbs & Title */}
          <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Add New Property</h1>
              <p className="text-slate-500 text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-widest">List your property in the network</p>
            </div>
            <div className="grid grid-cols-2 sm:flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setJsonImportType('sell');
                  setShowJsonModal(true);
                }}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition-all border-r border-gray-100 shrink-0"
              >
                <Bot className="w-4 h-4" />
                SELL JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setJsonImportType('rent');
                  setShowJsonModal(true);
                }}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 transition-all border-r border-gray-100 shrink-0"
              >
                <Bot className="w-4 h-4" />
                RENT JSON
              </button>
              {[
                { id: 'sell', label: 'Sell', icon: Tag },
                { id: 'rent', label: 'Rent', icon: IndianRupee },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, listingType: type.id })}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shrink-0 ${formData.listingType === type.id
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
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="label m-0">Property Type <span className="text-rose-500">*</span></label>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add New
                        </button>
                      </div>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, furnishing: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="label">Description <span className="text-rose-500">*</span></label>
                    <textarea
                      rows="5" required
                      placeholder="Describe your property features, and what makes it special..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, bhk: e.target.value })}
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
                        type="number" required placeholder="e.g. 2"
                        value={formData.bedrooms}
                        onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Bathrooms <span className="text-rose-500">*</span></label>
                      <input
                        type="number" required placeholder="e.g. 2"
                        value={formData.bathrooms}
                        onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, balconies: e.target.value })}
                        placeholder="e.g. 1"
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Floor No.</label>
                      <input
                        type="text"
                        value={formData.floorNumber}
                        onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                        placeholder="e.g. 2"
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Total Floors</label>
                      <input
                        type="text"
                        value={formData.totalFloors}
                        onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })}
                        placeholder="e.g. 15"
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Property Age</label>
                      <input
                        type="text"
                        value={formData.propertyAge}
                        onChange={(e) => setFormData({ ...formData, propertyAge: e.target.value })}
                        placeholder="e.g. 5 Years"
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Status <span className="text-rose-500">*</span></label>
                      <select
                        required
                        value={formData.propertyStatus}
                        onChange={(e) => setFormData({ ...formData, propertyStatus: e.target.value })}
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
                        type="text" required placeholder="Enter locality or area"
                        value={formData.locality}
                        onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="label">Landmark (optional)</label>
                      <input
                        type="text" placeholder="e.g. Near Central Park"
                        value={formData.landmark}
                        onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="label">Address <span className="text-rose-500">*</span></label>
                      <textarea
                        rows="1" required
                        placeholder="Enter full address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="input"
                      ></textarea>
                    </div>
                    <div className="space-y-2">
                      <label className="label">Pincode <span className="text-rose-500">*</span></label>
                      <input
                        type="text" required placeholder="Enter pincode"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dynamic Pricing Section */}
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
                            type="text" required placeholder="e.g. 1.5 Cr"
                            value={formData.totalPrice}
                            onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="label">Price per Sq Ft</label>
                          <input
                            type="text" placeholder="e.g. 12000"
                            value={formData.pricePerSqFt}
                            onChange={(e) => setFormData({ ...formData, pricePerSqFt: e.target.value })}
                            className="input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="label">Negotiable?</label>
                        <select
                          value={formData.negotiable}
                          onChange={(e) => setFormData({ ...formData, negotiable: e.target.value })}
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
                            type="text" required placeholder="e.g. 45,000"
                            value={formData.monthlyRent}
                            onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="label">Security Deposit (₹) <span className="text-rose-500">*</span></label>
                          <input
                            type="text" required placeholder="e.g. 1,00,000"
                            value={formData.securityDeposit}
                            onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                            className="input"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <label className="label">Maintenance Charges</label>
                          <input
                            type="text" placeholder="e.g. 3,500 / Month"
                            value={formData.maintenance}
                            onChange={(e) => setFormData({ ...formData, maintenance: e.target.value })}
                            className="input"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="label">Preferred Tenants</label>
                          <select
                            value={formData.preferredTenants}
                            onChange={(e) => setFormData({ ...formData, preferredTenants: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div className="flex items-center gap-2 px-2">
                        <div
                          onClick={() => setFormData({ ...formData, availableNow: !formData.availableNow })}
                          className={`w-6 h-6 rounded-lg border-2 transition-all cursor-pointer flex items-center justify-center ${formData.availableNow ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}
                        >
                          {formData.availableNow && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Available for now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Grouped Amenities */}
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
                            className={`flex items-center gap-2 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-all ${formData.amenities.includes(amenity.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'border-gray-200'}`}
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
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <input
                        type="text" required placeholder="e.g. Vishal Sharma"
                        value={formData.contactName}
                        onChange={(e) => {
                          // Allow only letters and spaces
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) {
                            setFormData({ ...formData, contactName: val });
                          }
                        }}
                        className="input pl-12"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="label">Phone Number <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                          <Phone className="w-5 h-5" />
                        </div>
                        <input
                          type="tel" required placeholder="+91 98765 43210"
                          value={formData.contactPhone}
                          onChange={(e) => {
                            // Allow only digits, +, spaces, and hyphens
                            const val = e.target.value;
                            if (/^[0-9+\-\s]*$/.test(val)) {
                              setFormData({ ...formData, contactPhone: val });
                            }
                          }}
                          className="input pl-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="label">Email Address <span className="text-rose-500">*</span></label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <input
                          type="email" required placeholder="vishal@example.com"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                          className="input pl-12"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Property Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card"
            >
              <h3 className="section-title mb-2">Property Images</h3>
              <p className="text-sm font-medium text-gray-500 mb-8">Upload a main featured image and multiple gallery images for your property.</p>

              <div className="space-y-8">
                {/* Main Image Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Main Featured Image</h4>
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
                          <img src={mainImage} className="w-full h-full object-cover rounded-xl shadow-md" alt="Main" />
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); removeMainImage(); }}
                            className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                            {uploading ? <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <ImageIcon className="w-6 h-6 text-indigo-600" />}
                          </div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
                            {uploading ? 'Uploading...' : 'Set Main Image'}
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Sub Images Gallery */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gallery Images (Sub Images)</h4>
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
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 text-indigo-600" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-900 uppercase tracking-tight">Add Gallery</p>
                    </label>

                    <AnimatePresence>
                      {subImages.map((img, idx) => (
                        <motion.div
                          key={img + idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative aspect-[4/3] group shadow-sm border border-gray-100 rounded-2xl overflow-hidden"
                        >
                          <img
                            src={img}
                            alt={`Gallery ${idx}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <button
                            type="button"
                            onClick={() => removeSubImage(idx)}
                            className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
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
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-5 h-5 fill-white" />
                )}
                Publish Property
              </button>
            </div>
          </form>
        </div>
      </main>

      <BulkImportModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        onSuccess={() => navigate('/vendor/properties')}
        defaultListingType={jsonImportType}
      />

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
              onClick={() => navigate('/vendor/dashboard')}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[32px] shadow-2xl overflow-hidden max-w-lg w-full"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Property Published!</h2>
                <p className="text-slate-500 font-medium mb-10">Your property is now live and visible to millions of potential buyers.</p>

                {/* PREVIEW CARD */}
                <div className="bg-slate-50 rounded-3xl p-6 mb-10 text-left border border-slate-100 group cursor-pointer hover:bg-white hover:shadow-xl transition-all duration-500">
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                    <img
                      src={lastCreatedProperty?.mainImage || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800'}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      alt="Preview"
                    />
                    <div className="absolute top-4 left-4 px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-lg">
                      {lastCreatedProperty?.type}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 truncate mb-1">{lastCreatedProperty?.title}</h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    {lastCreatedProperty?.location?.city}, {lastCreatedProperty?.location?.state}
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                      ₹{Number(lastCreatedProperty?.price).toLocaleString()}
                    </div>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      {lastCreatedProperty?.listingType}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate('/vendor/dashboard')}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm tracking-tight hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/user/home')}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm tracking-tight hover:bg-indigo-700 transition-all shadow-lg"
                  >
                    View on Portal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
