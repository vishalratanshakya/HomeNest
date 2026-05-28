import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { MapPin, Star, Heart, SlidersHorizontal, X } from 'lucide-react';
import { useCategories } from '../../src/core/contexts/CategoryContext';
import UserNavbar from '../components/UserNavbar';
import { authService, firestoreService } from '../../src/core/services/firebaseService';
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import toast from 'react-hot-toast';

export default function UserSearch() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    bedrooms: 'all',
    bathrooms: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('category');
  const [favorites, setFavorites] = useState([]);
  const { categories } = useCategories();

  const premiumDummyImages = [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800',
    'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
    'https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
  ];

  const getPropertyImage = (product, index) => {
    // If it's a real property from Firebase with images, optimize them
    if (product.mainImage) {
      return cloudinaryService.optimizeUrl(product.mainImage, { width: 500, height: 400, crop: 'fill' });
    }
    if (product.images && product.images.length > 0) {
      return cloudinaryService.optimizeUrl(product.images[0], { width: 500, height: 400, crop: 'fill' });
    }
    // Fallback to optimized dummy images
    const rawImg = premiumDummyImages[index % premiumDummyImages.length];
    return cloudinaryService.optimizeUrl(rawImg, { width: 500, height: 400, crop: 'fill' });
  };

  const getPropertyLink = (property) => {
    if (!property || !property.id) return '/user/home';
    const type = (property.listingType || property.category || '').toLowerCase();
    if (type === 'rent') return `/user/rent/${property.id}`;
    return `/user/sale/${property.id}`;
  };

  useEffect(() => {
    const queryParam = searchParams.get('q');
    const categoryParam = searchParams.get('category');
    
    if (queryParam) {
      setSearchTerm(queryParam);
    }
    
    if (categoryParam) {
      setFilters(prev => ({ ...prev, category: categoryParam }));
    }

    setLoading(true);
    const unsubscribe = firestoreService.subscribeToProperties({ status: 'active' }, (data) => {
      setProducts(data);
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

    return () => unsubscribe();
  }, [searchParams]);

  const filteredProducts = products.filter((product) => {
    const city = typeof product.location === 'object' ? product.location.city : product.location;
    const description = product.description || "";
    const name = product.title || product.name || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filters.category === 'all' || 
                           product.category === filters.category || 
                           product.type === filters.category;
    
    const matchesPrice =
      filters.priceRange === 'all' ||
      (filters.priceRange === 'under-500k' && product.price < 500000) ||
      (filters.priceRange === '500k-1m' && product.price >= 500000 && product.price < 1000000) ||
      (filters.priceRange === '1m-plus' && product.price >= 1000000);
    
    const matchesBedrooms =
      filters.bedrooms === 'all' ||
      (filters.bedrooms === '1-2' && product.specifications.bedrooms <= 2) ||
      (filters.bedrooms === '3-4' && product.specifications.bedrooms >= 3 && product.specifications.bedrooms <= 4) ||
      (filters.bedrooms === '5-plus' && product.specifications.bedrooms >= 5);
    
    const matchesBathrooms =
      filters.bathrooms === 'all' ||
      (filters.bathrooms === '1' && product.specifications.bathrooms === 1) ||
      (filters.bathrooms === '2' && product.specifications.bathrooms === 2) ||
      (filters.bathrooms === '3-plus' && product.specifications.bathrooms >= 3);

    return matchesSearch && matchesCategory && matchesPrice && matchesBedrooms && matchesBathrooms && product.status === 'active';
  });

  const toggleFavorite = async (productId) => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    const isCurrentlyFavorite = favorites.includes(productId);

    // Optimistic update
    setFavorites(prev => isCurrentlyFavorite ? prev.filter(id => id !== productId) : [...prev, productId]);
    
    if (!isCurrentlyFavorite) {
      toast.success('Added to wishlist!', {
        icon: '❤️',
        style: { borderRadius: '16px', background: '#333', color: '#fff' },
      });
    } else {
      toast.success('Removed from wishlist', { icon: '💔' });
    }

    try {
      await firestoreService.toggleWishlist(user.uid, productId);
    } catch (error) {
      console.error('Wishlist error:', error);
      // Revert state
      setFavorites(prev => isCurrentlyFavorite ? [...prev, productId] : prev.filter(id => id !== productId));
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <UserNavbar />
      <main className="max-w-full mx-auto px-4 pt-1 pb-6 sm:px-6 lg:px-12 sm:pt-2">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setFilters({ category: 'all', priceRange: 'all', bedrooms: 'all', bathrooms: 'all' })}
                  className="text-xs font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Prices</option>
                    <option value="under-500k">Under $500k</option>
                    <option value="500k-1m">$500k - $1M</option>
                    <option value="1m-plus">$1M+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Any</option>
                    <option value="1-2">1-2</option>
                    <option value="3-4">3-4</option>
                    <option value="5-plus">5+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                  <select
                    value={filters.bathrooms}
                    onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">Any</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3-plus">3+</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center space-x-3 px-6 py-3.5 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-all group"
                >
                  <SlidersHorizontal className="w-5 h-5 text-primary-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[13px] font-black text-[#1e293b] uppercase tracking-[0.15em]">Filters</span>
                </button>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Properties</h2>
                  <div className="flex items-center space-x-3 mt-1">
                    <p className="text-gray-500 font-bold text-sm tracking-wide">{filteredProducts.length} results</p>
                    {(filters.category !== 'all' || filters.priceRange !== 'all' || filters.bedrooms !== 'all' || filters.bathrooms !== 'all') && (
                      <button 
                        onClick={() => setFilters({ category: 'all', priceRange: 'all', bedrooms: 'all', bathrooms: 'all' })}
                        className="px-3 py-1 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider rounded-full hover:bg-red-100 transition-all border border-red-100"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Filters Left Drawer (Two-Pane Layout) */}
            <div 
              className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
                showFilters ? 'visible opacity-100' : 'invisible opacity-0'
              }`}
            >
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowFilters(false)}
              />
              <div 
                className={`absolute top-0 bottom-0 left-0 w-full max-w-[90%] bg-white transition-transform duration-500 shadow-2xl flex flex-col ${
                  showFilters ? 'translate-x-0' : '-translate-x-full'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => setShowFilters(false)} className="p-2 -ml-2 text-gray-500">
                      <X className="w-6 h-6" />
                    </button>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest">Filters</h3>
                  </div>
                  <button 
                    onClick={() => setFilters({ category: 'all', priceRange: 'all', bedrooms: 'all', bathrooms: 'all' })}
                    className="text-primary-600 font-black text-xs uppercase tracking-widest"
                  >
                    Reset
                  </button>
                </div>

                {/* Two-Pane Body */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Left Sidebar (Tabs) */}
                  <div className="w-1/3 bg-gray-50 border-r border-gray-100 overflow-y-auto">
                    {[
                      { id: 'category', label: 'Category' },
                      { id: 'price', label: 'Price' },
                      { id: 'beds', label: 'Beds' },
                      { id: 'baths', label: 'Baths' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveFilterTab(tab.id)}
                        className={`w-full py-6 px-4 text-left transition-all relative ${
                          activeFilterTab === tab.id 
                            ? 'bg-white text-primary-600' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        <span className={`text-xs font-black uppercase tracking-widest ${activeFilterTab === tab.id ? 'opacity-100' : 'opacity-60'}`}>
                          {tab.label}
                        </span>
                        {activeFilterTab === tab.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-500 rounded-r-full" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Right Content (Options) */}
                  <div className="w-2/3 bg-white overflow-y-auto p-6 animate-fadeIn">
                    {activeFilterTab === 'category' && (
                      <div className="space-y-3">
                        {['all', ...categories.map(c => c.id)].map((catId) => (
                          <button
                            key={catId}
                            onClick={() => setFilters({ ...filters, category: catId })}
                            className={`w-full p-4 rounded-2xl text-left font-bold transition-all flex items-center justify-between border-2 ${
                              filters.category === catId 
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                                : 'border-gray-50 bg-gray-50 text-gray-500'
                            }`}
                          >
                            <span className="text-sm">
                              {catId === 'all' ? 'All Types' : categories.find(c => c.id === catId)?.name}
                            </span>
                            {filters.category === catId && <div className="w-2 h-2 bg-primary-600 rounded-full" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {activeFilterTab === 'price' && (
                      <div className="space-y-3">
                        {[
                          { id: 'all', label: 'Any Price' },
                          { id: 'under-500k', label: 'Under $500k' },
                          { id: '500k-1m', label: '$500k - $1M' },
                          { id: '1m-plus', label: '$1M+' }
                        ].map((range) => (
                          <button
                            key={range.id}
                            onClick={() => setFilters({ ...filters, priceRange: range.id })}
                            className={`w-full p-4 rounded-2xl text-left font-bold transition-all border-2 ${
                              filters.priceRange === range.id 
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                                : 'border-gray-50 bg-gray-50 text-gray-500'
                            }`}
                          >
                            <span className="text-sm">{range.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {activeFilterTab === 'beds' && (
                      <div className="grid grid-cols-1 gap-3">
                        {['all', '1-2', '3-4', '5-plus'].map((bed) => (
                          <button
                            key={bed}
                            onClick={() => setFilters({ ...filters, bedrooms: bed })}
                            className={`w-full p-4 rounded-2xl text-left font-bold border-2 transition-all ${
                              filters.bedrooms === bed 
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                                : 'border-gray-50 bg-gray-50 text-gray-500'
                            }`}
                          >
                            <span className="text-sm">{bed === 'all' ? 'Any Bedrooms' : bed + ' Bedrooms'}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {activeFilterTab === 'baths' && (
                      <div className="grid grid-cols-1 gap-3">
                        {['all', '1', '2', '3-plus'].map((bath) => (
                          <button
                            key={bath}
                            onClick={() => setFilters({ ...filters, bathrooms: bath })}
                            className={`w-full p-4 rounded-2xl text-left font-bold border-2 transition-all ${
                              filters.bathrooms === bath 
                                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm' 
                                : 'border-gray-50 bg-gray-50 text-gray-500'
                            }`}
                          >
                            <span className="text-sm">{bath === 'all' ? 'Any Bathrooms' : bath + ' Bathrooms'}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-100">
                  <button 
                    onClick={() => setShowFilters(false)}
                    className="w-full py-4 btn-gradient text-white font-black rounded-2xl shadow-xl shadow-orange-100 uppercase tracking-[0.2em]"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => {
                const city = typeof product.location === 'object' ? product.location.city : product.location;
                const state = typeof product.location === 'object' ? product.location.state : "";
                const mainImg = getPropertyImage(product, idx);
                
                return (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                    <div className="relative">
                      <Link to={getPropertyLink(product)}>
                        <img
                          src={mainImg}
                          alt={product.title || product.name}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </Link>
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className="absolute top-3 right-3 p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-all"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 line-clamp-1">{product.title || product.name}</h4>
                          {product.vendorName && (
                            <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mt-0.5">
                              By {product.vendorName}
                            </div>
                          )}
                          {product.shortDescription && (
                            <p className="text-[11px] text-gray-500 font-medium line-clamp-1 mt-0.5">{product.shortDescription}</p>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                          <span>{product.rating || "5.0"}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="line-clamp-1">{city}{state ? `, ${state}` : ""}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>{product.bhk || product.specifications?.bedrooms || "0"} BHK</span>
                        <span>{product.bathrooms || product.specifications?.bathrooms || "0"} bath</span>
                        <span>{product.area || product.specifications?.area || "0"} sqft</span>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                        <span className="text-xl font-black text-blue-600">
                          ₹{Number(product.price).toLocaleString()}
                        </span>
                        <Link
                          to={getPropertyLink(product)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-black uppercase tracking-widest shrink-0"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No properties found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
