import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./userDashboard.css";
import { Heart, MapPin, Star, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import { authService, firestoreService } from '../../src/core/services/firebaseService';

const SavedProperties = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('Newest');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatLocation = (loc) => {
    if (!loc) return 'Location not provided';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      const parts = [loc.address, loc.city, loc.state].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'Location not provided';
    }
    return 'Location not provided';
  };

  const mapToProperty = (data) => ({
    ...data,
    name: data.title || data.name || 'Unnamed Property',
    location: formatLocation(data.location),
    image: data.mainImage || (data.images && data.images[0]) || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    priceDisplay: data.price ? `₹${Number(data.price).toLocaleString()}` : 'Price on Request',
    rating: data.rating || 4.5
  });

  React.useEffect(() => {
    let unsubscribeAuth = () => {};
    let cancelled = false;

    const fetchSaved = async (uid) => {
      setLoading(true);
      try {
        const ids = await firestoreService.getUserWishlist(uid);
        if (cancelled) return;
        if (ids.length > 0) {
          const props = await firestoreService.getPropertiesByIds(ids);
          if (!cancelled) setProperties(props.map(mapToProperty));
        } else {
          if (!cancelled) setProperties([]);
        }
      } catch (err) {
        console.error("Error fetching saved properties:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Subscribe to auth state — waits for Firebase to hydrate on refresh
    unsubscribeAuth = authService.onAuthStateChange((user) => {
      if (user) {
        fetchSaved(user.uid);
      } else {
        setProperties([]);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribeAuth();
    };
  }, []);


  const handleSort = (type) => {
    setSortBy(type);
    setShowSortDropdown(false);
    
    let sorted = [...properties];
    if (type === 'Price: Low to High') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (type === 'Price: High to Low') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (type === 'Rating') {
      sorted.sort((a, b) => b.rating - a.rating);
    } else {
      sorted.sort((a, b) => b.date - a.date);
    }
    setProperties(sorted);
    toast.success(`Sorted by ${type}`);
  };

  const handleRemove = async (id, name) => {
    const user = authService.getCurrentUser();
    if (!user) return;

    try {
      await firestoreService.toggleWishlist(user.uid, id);
      setProperties(prev => prev.filter(p => p.id !== id));
      toast.success(`${name} removed from saved`, { icon: '💔' });
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove property");
    }
  };

  return (
    <>
      <div className="dashboard-card">
        <div className="card-header">
          <div>
            <h2>Saved Properties</h2>
            <p className="profile-subtitle">You have {properties.length} properties saved</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-gray-600 hover:bg-white hover:shadow-sm transition-all"
            >
              Sort By: {sortBy}
              <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-50 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                {['Newest', 'Price: Low to High', 'Price: High to Low', 'Rating'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleSort(type)}
                    className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-primary-50 hover:text-primary-600 transition-colors ${sortBy === type ? 'text-primary-600 bg-primary-50/50' : 'text-gray-600'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {properties.length > 0 ? (
          <div className="saved-properties-grid">
            {properties.map(property => (
              <div key={property.id} className="property-card group">
                <div className="relative overflow-hidden rounded-2xl">
                  <img 
                    src={cloudinaryService.optimizeUrl(property.image, { width: 400, height: 300, crop: 'fill' })} 
                    alt={property.name} 
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <button 
                    onClick={() => handleRemove(property.id, property.name)}
                    className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1 bg-primary-600/90 backdrop-blur-md text-white text-[10px] font-black rounded-lg uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="property-content mt-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors">
                      {property.name}
                    </h3>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                      <span className="text-xs font-black text-amber-700">{property.rating}</span>
                    </div>
                  </div>

                  <p className="flex items-center gap-1.5 text-gray-400 text-sm font-bold mb-6">
                    <MapPin className="w-4 h-4 text-primary-500" /> {property.location}
                  </p>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</span>
                      <span className="text-lg font-black text-primary-600">{property.priceDisplay}</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/user/product/${property.id}`)}
                      className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all uppercase tracking-widest active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900">No Saved Properties</h3>
            <p className="text-gray-400 font-bold mt-2">Start exploring and save your favorites!</p>
            <button 
              onClick={() => navigate('/user/home')}
              className="mt-6 px-8 py-3 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all"
            >
              Explore Properties
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default SavedProperties;
