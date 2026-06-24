import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  Star, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  ChevronRight,
  Eye,
  Edit3,
  Pencil,
  Trash2,
  Tag,
  IndianRupee,
  Clock,
  X,
  LayoutGrid,
  TrendingUp,
  MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OwnerSidebar from '../components/OwnerSidebar';
import OwnerHeader from '../components/OwnerHeader';
import toast from 'react-hot-toast';
import { firestoreService, authService } from '../../src/core/services/firebaseService';
import { cloudinaryService } from '../../src/core/services/cloudinaryService';

export default function Properties() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    listingType: "",
    minPrice: "",
    maxPrice: ""
  });

  const [properties, setProperties] = useState([]);

  useEffect(() => {
    let unsubscribeProperties;
    const unsubscribeAuth = authService.onAuthStateChange((user) => {
      if (!user) return;
      
      setLoading(true);
      unsubscribeProperties = firestoreService.subscribeToProperties(
        {},
        (data) => {
          const filtered = data.filter(
            (p) => p.ownerId === user.uid
          );
          setProperties(filtered);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProperties) unsubscribeProperties();
    };
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      try {
        await firestoreService.deleteProperty(id);
        toast.success("Property deleted successfully");
      } catch (error) {
        toast.error("Failed to delete property");
      }
    }
  };

  const formatPrice = (price, type) => {
    const num = Number(price);
    if (!num) return '₹0';
    if (type === 'sell') {
      if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)} Cr`;
      if (num >= 100000) return `₹${(num / 100000).toFixed(1)} L`;
    }
    return `₹${num.toLocaleString()}`;
  };

  const filteredProperties = properties.filter((p) => {
    const locationString = typeof p.location === 'object' 
      ? `${p.location.city} ${p.location.state} ${p.location.address} ${p.location.locality}`
      : p.location || "";

    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                          locationString.toLowerCase().includes(search.toLowerCase()) ||
                          p.city?.toLowerCase().includes(search.toLowerCase());
    
    const matchesListingType = !filters.listingType || p.listingType === filters.listingType;
    const matchesStatus = !filters.status || p.status.toLowerCase() === filters.status.toLowerCase();
    const matchesType = !filters.type || p.type.toLowerCase() === filters.type.toLowerCase();
    
    const price = Number(p.price);
    const matchesMinPrice = !filters.minPrice || price >= Number(filters.minPrice);
    const matchesMaxPrice = !filters.maxPrice || price <= Number(filters.maxPrice);

    return matchesSearch && matchesListingType && matchesStatus && matchesType && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <div className="flex min-h-screen bg-gray-100">
      <OwnerSidebar />
      <main className="flex-1 lg:ml-72 ml-0 transition-all duration-300">
        <OwnerHeader />
        
        <div className="px-4 sm:px-10 py-6">
          <div className="flex flex-row justify-between items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Properties</h1>
              <p className="text-gray-500 text-[10px] sm:text-sm font-medium mt-1">
                {filteredProperties.length} listings
              </p>
            </div>
            <button 
              onClick={() => navigate('/owner/add-property')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add New Property</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-row gap-2 mb-8">
            <div className="relative w-1/2 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              />
            </div>
            <div className="relative w-1/2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full h-full px-2 sm:px-4 bg-white border border-gray-100 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all shadow-sm ${showFilters ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'text-gray-600'}`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                {(filters.listingType || filters.status || filters.type || filters.minPrice || filters.maxPrice) && (
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                )}
              </button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 z-50"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-gray-900">Filters</h4>
                      <button 
                        onClick={() => {
                          setFilters({ type: "", status: "", listingType: "", minPrice: "", maxPrice: "" });
                          setShowFilters(false);
                        }}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Reset All
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Listing Type</label>
                        <select 
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                          value={filters.listingType}
                          onChange={(e) => setFilters({...filters, listingType: e.target.value})}
                        >
                          <option value="">All Types</option>
                          <option value="sell">Sell</option>
                          <option value="rent">Rent</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Property Type</label>
                        <select 
                          className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                          value={filters.type}
                          onChange={(e) => setFilters({...filters, type: e.target.value})}
                        >
                          <option value="">All Categories</option>
                          <option value="Apartment">Apartment</option>
                          <option value="Villa">Villa</option>
                          <option value="Penthouse">Penthouse</option>
                          <option value="Plot">Plot</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Min Price</label>
                          <input 
                            type="number" placeholder="0"
                            value={filters.minPrice}
                            onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Max Price</label>
                          <input 
                            type="number" placeholder="99M"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setShowFilters(false)}
                      className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Apply Filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProperties.map((property, idx) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="card !p-0 group overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={cloudinaryService.optimizeUrl(property.mainImage || property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800', { width: 600, height: 400, crop: 'fill' })} 
                    alt={property.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    loading="lazy"
                  />
                  
                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg ${
                      property.status === 'Available' ? 'bg-green-500/90 text-white' : 'bg-amber-500/90 text-white'
                    }`}>
                      {property.status}
                    </div>
                    <div className="px-4 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-1 shadow-lg">
                      {property.listingType === 'sell' && <Tag className="w-3 h-3 text-indigo-600" />}
                      {property.listingType === 'rent' && <IndianRupee className="w-3 h-3 text-indigo-600" />}
                      {property.listingType.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-xl text-white">
                      <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">
                        {property.listingType === 'sell' ? 'Total Price' : 'Monthly Rent'}
                      </p>
                      <p className="text-lg font-black tracking-tight">
                        {formatPrice(property.price, property.listingType)}
                        {property.listingType === 'rent' && <span className="text-xs font-normal ml-1">/mo</span>}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-extrabold text-gray-900 tracking-tight truncate group-hover:text-indigo-600 transition-colors">{property.title}</h3>
                    <div className="flex items-center gap-1 text-gray-400 text-xs font-bold mt-1 uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {typeof property.location === 'object' 
                        ? `${property.location.city}, ${property.location.state}` 
                        : property.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-4 border-y border-gray-50 mb-6">
                    <div className="flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">{property.bhk}</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">{property.area}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl group/stat hover:bg-indigo-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover/stat:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Views</p>
                        <p className="text-sm font-black text-gray-900">{property.views}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl group/stat hover:bg-rose-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover/stat:scale-110 transition-transform">
                        <MessageCircle className="w-5 h-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Leads</p>
                        <p className="text-sm font-black text-gray-900">{property.leads}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => navigate(`/owner/edit-property/${property.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                    >
                      <Pencil className="w-4 h-4" />
                      EDIT
                    </button>
                    <button 
                      onClick={() => handleDelete(property.id)}
                      className="px-4 py-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => navigate(`/user/product/${property.id}`)}
                      className="px-4 py-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProperties.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-8"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No properties found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term</p>
              <button 
                onClick={() => setFilters({ type: "", status: "", listingType: "", minPrice: "", maxPrice: "" })}
                className="mt-6 text-indigo-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
