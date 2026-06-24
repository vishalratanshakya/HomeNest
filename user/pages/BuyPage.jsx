import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Heart, Search, Bed, Bath, Maximize, X } from 'lucide-react';
import UserNavbar from '../components/UserNavbar';
import { authService, firestoreService } from '../../src/core/services/firebaseService';
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import toast from 'react-hot-toast';
import './buy.css';



export default function BuyPage() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchName, setSearchName] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [bhk, setBhk] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsub = firestoreService.subscribeToProperties({ status: 'active' }, (data) => {
      const saleProps = data.filter(p => 
        p.listingType?.toLowerCase() === 'sale' || 
        p.listingType?.toLowerCase() === 'sell' ||
        p.category?.toLowerCase() === 'sale' ||
        p.category?.toLowerCase() === 'sell' ||
        p.category?.toLowerCase() === 'buy'
      );
      setProperties(saleProps);
      setLoading(false);
    });

    // Fetch wishlist
    const fetchWishlist = async () => {
      const user = authService.getCurrentUser();
      if (user) {
        const wishlist = await firestoreService.getUserWishlist(user.uid);
        setFavorites(wishlist);
      }
    };
    fetchWishlist();

    return () => unsub();
  }, []);

  const toggleFavorite = async (id) => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    const isCurrentlyFavorite = favorites.includes(id);

    // Optimistic update
    setFavorites(prev => isCurrentlyFavorite ? prev.filter(f => f !== id) : [...prev, id]);
    
    if (!isCurrentlyFavorite) {
      toast.success('Added to wishlist!', {
        icon: '❤️',
        style: { borderRadius: '16px', background: '#333', color: '#fff' },
      });
    } else {
      toast.success('Removed from wishlist', { icon: '💔' });
    }

    try {
      await firestoreService.toggleWishlist(user.uid, id);
    } catch (error) {
      console.error('Wishlist error:', error);
      // Revert state
      setFavorites(prev => isCurrentlyFavorite ? [...prev, id] : prev.filter(f => f !== id));
      toast.error('Failed to update wishlist');
    }
  };

  const filtered = properties.filter(item => {
    const title = (item.title || item.name || "").toLowerCase();
    const location = (typeof item.location === 'object' 
      ? `${item.location.city || ''} ${item.location.locality || ''}`
      : (item.location || "")).toLowerCase();
    
    const nameMatch = title.includes(searchName.toLowerCase());
    const locationMatch = location.includes(search.toLowerCase());
    const furnishingMatch = furnishing ? (item.furnishing?.toLowerCase() === furnishing.toLowerCase()) : true;
    
    // Price range matching (Sale prices are higher)
    let priceMatch = true;
    const price = Number(item.price || item.pricing?.price || 0);
    if (priceRange === 'below-50l') priceMatch = price < 5000000;
    else if (priceRange === '50l-1cr') priceMatch = price >= 5000000 && price <= 10000000;
    else if (priceRange === '1cr-5cr') priceMatch = price >= 10000000 && price <= 50000000;
    else if (priceRange === 'above-5cr') priceMatch = price > 50000000;

    // BHK matching
    const bhkMatch = bhk ? (Number(item.bedrooms || item.bhk || 0) === Number(bhk)) : true;
    
    // Property Type matching
    const typeMatch = propertyType ? (
      item.propertyType?.toLowerCase() === propertyType.toLowerCase() ||
      item.type?.toLowerCase() === propertyType.toLowerCase()
    ) : true;

    return nameMatch && locationMatch && furnishingMatch && priceMatch && bhkMatch && typeMatch;
  });



  const formatPrice = (price) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)} Lac`;
    return `₹${price.toLocaleString()}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <UserNavbar />

      <div className="px-4 sm:px-6 lg:px-8 pt-1 pb-4 sm:pt-2 sm:pb-8 max-w-full mx-auto">
        
        {/* Mobile Filter Trigger */}
        <div className="mobile-filter-top">
          <button
            className="mobile-filter-btn"
            onClick={() => setShowMobileFilters(true)}
          >
            ☰ Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* FILTER SIDEBAR / MOBILE DRAWER */}
          <>
            <div 
              className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 lg:hidden ${showMobileFilters ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
              onClick={() => setShowMobileFilters(false)}
            />
            
            <aside className={`fixed inset-y-0 left-0 w-80 bg-white z-[70] p-6 shadow-2xl transition-transform duration-300 lg:static lg:w-[320px] lg:z-0 lg:p-0 lg:bg-transparent lg:shadow-none lg:translate-x-0 ${showMobileFilters ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="bg-white rounded-3xl p-6 lg:border lg:border-gray-100 lg:shadow-sm lg:sticky lg:top-24 h-full lg:h-fit overflow-y-auto lg:overflow-visible">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-wider">Filters</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setSearch(""); setSearchName(""); setFurnishing(""); 
                        setPriceRange(""); setBhk(""); setPropertyType("");
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                    >
                      Reset
                    </button>
                    <button onClick={() => setShowMobileFilters(false)} className="lg:hidden p-2 bg-gray-50 rounded-xl">
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 pb-10 lg:pb-0">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Property Name</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search name..."
                        className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search city/locality..."
                        className="w-full bg-gray-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Budget</label>
                    <select
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                    >
                      <option value="">Any Budget</option>
                      <option value="below-50l">Below ₹50 Lac</option>
                      <option value="50l-1cr">₹50 Lac - ₹1 Cr</option>
                      <option value="1cr-5cr">₹1 Cr - ₹5 Cr</option>
                      <option value="above-5cr">Above ₹5 Cr</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">BHK Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['1', '2', '3', '4', '5'].map((num) => (
                        <button
                          key={num}
                          onClick={() => setBhk(bhk === num ? '' : num)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                            bhk === num 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {num} BHK
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Furnishing Status</label>
                    <select
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="furnished">Furnished</option>
                      <option value="semi">Semi-Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Property Type</label>
                    <select
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                    >
                      <option value="">Any Property</option>
                      <option value="apartment">Apartment</option>
                      <option value="villa">Villa</option>
                      <option value="house">Independent House</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full lg:hidden py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 active:scale-95 transition-all mt-4"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </aside>
          </>

          {/* RIGHT PROPERTY SECTION */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-wider">Sale Properties</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  {filtered.length} Results Found
                </p>
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] h-80 animate-pulse border border-gray-50" />
                ))}
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((item, idx) => {
                  const img = item.images?.[0] || item.mainImage || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
                  const isFav = favorites.includes(item.id);
                  const price = Number(item.price || item.pricing?.price || 0);
                  const locationText = typeof item.location === 'object'
                    ? `${item.location.locality ? item.location.locality + ', ' : ''}${item.location.city}`
                    : item.location || 'Location';

                  return (
                    <div
                      key={item.id || idx}
                      className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden hover-lift active:scale-95 transition-all shine group"
                      onClick={() => navigate(`/user/sale/${item.id}`)}
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img 
                          src={cloudinaryService.optimizeUrl(img, { width: 600, height: 400, crop: 'fill' })} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                          alt="" 
                          loading={idx < 2 ? "eager" : "lazy"}
                          {...(idx < 2 ? { fetchpriority: "high" } : {})}
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">For Sale</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                          className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all hover-lift"
                        >
                          <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                        </button>
                      </div>

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className="font-black text-gray-900 line-clamp-1 text-base uppercase tracking-tight">{item.title || item.name}</h4>
                          <div className="flex items-center text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                            <span>{item.rating || 4.5}</span>
                          </div>
                        </div>

                        {item.ownerName && (
                          <div className="text-[10px] font-extrabold text-blue-600 mb-1.5 uppercase tracking-widest">
                            By {item.ownerName}
                          </div>
                        )}

                        {/* Short Description */}
                        <p className="text-[11px] text-gray-400 line-clamp-1 mb-2 font-medium">
                          {item.description || "Premium property with modern amenities and scenic views."}
                        </p>

                        <div className="flex items-center text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-blue-500" />
                          <span className="truncate">{locationText}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                          <span className="text-base font-bold text-primary-600 min-w-0 flex-1 truncate">
                            {(() => {
                              const p = Number(item.price || item.pricing?.price || 0);
                              if (!p) return 'Contact';
                              if (p >= 10000000) return `₹${(p / 10000000).toFixed(1)}Cr`;
                              if (p >= 100000) return `₹${(p / 100000).toFixed(1)}L`;
                              return `₹${(p / 1000).toFixed(0)}k`;
                            })()}
                          </span>
                          <div className="flex-shrink-0 px-3 py-2 btn-gradient rounded-xl text-xs font-bold text-white uppercase shadow-lg shadow-orange-100">
                            View
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">No matching properties</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Try adjusting your filters to find more results</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
