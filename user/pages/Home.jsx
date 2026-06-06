import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dummyCategories } from '@core/utils/dummyData';
import { MapPin, Star, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import UserNavbar from '../components/UserNavbar';
import heroBanner from '../../src/assets/images/hero-banner.png';
import { authService, firestoreService } from '../../src/core/services/firebaseService';
import { cloudinaryService } from '../../src/core/services/cloudinaryService';
import toast from 'react-hot-toast';

export default function UserHome() {
  const [properties, setProperties] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [categorySlides, setCategorySlides] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestoreService.subscribeToProperties({}, (data) => {
      setProperties(data);
      setLoading(false);
    });

    // Fetch wishlist — subscribe to auth state so it works on refresh
    const unsubscribeAuth = authService.onAuthStateChange(async (user) => {
      if (user) {
        try {
          const wishlist = await firestoreService.getUserWishlist(user.uid);
          setFavorites(wishlist);
        } catch (e) {
          console.error('Wishlist fetch error:', e);
        }
      } else {
        setFavorites([]);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeAuth();
    };
  }, []);

  // Show all properties in the hero section, newest first
  const heroProperties = [...properties]
    .sort((a, b) => {
      const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt : 0);
      const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt : 0);
      if (timeB === timeA) return 0; 
      return timeB - timeA;
    });
  
  const heroSlides = heroProperties.length > 0 ? heroProperties.slice(0, 5).map(p => ({
    image: getPropertyImage(p),
    title: p.title || p.name || 'Luxury Real Estate',
    subtitle: p.shortDescription || 'Discover your dream home in our curated collection of premium properties.',
    link: getPropertyLink(p)
  })) : [
    { image: heroBanner, title: 'Luxury Real Estate', subtitle: 'Discover your dream home in our curated collection of premium properties.', link: '#' },
    { image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200', title: 'Premium Villas', subtitle: 'Find the perfect villa for your family.', link: '#' },
    { image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200', title: 'Modern Apartments', subtitle: 'Experience the city life with premium amenities.', link: '#' },
    { image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200', title: 'Luxury Condos', subtitle: 'Your dream condo is waiting for you.', link: '#' }
  ];

  function getPropertyImage(property) {
    // If it's a real property from Firebase with images, optimize them
    if (property.mainImage) {
      return cloudinaryService.optimizeUrl(property.mainImage, { width: 600, crop: 'fill' });
    }
    if (property.images && property.images.length > 0) {
      return cloudinaryService.optimizeUrl(property.images[0], { width: 600, crop: 'fill' });
    }
    return 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
  };

  useEffect(() => {
    const slides = {};
    dummyCategories.forEach((category) => {
      slides[category.id] = 0;
    });
    setCategorySlides(slides);
  }, []);

  const toggleFavorite = async (productId) => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    const isCurrentlyFavorite = favorites.includes(productId);
    
    // Optimistic UI update
    setFavorites(prev => 
      !isCurrentlyFavorite ? [...prev, productId] : prev.filter(id => id !== productId)
    );
    
    if (!isCurrentlyFavorite) {
      toast.success('Added to wishlist!', {
        icon: '❤️',
        style: {
          borderRadius: '16px',
          background: '#333',
          color: '#fff',
        },
      });
    } else {
      toast.success('Removed from wishlist', {
        icon: '💔',
      });
    }

    try {
      await firestoreService.toggleWishlist(user.uid, productId);
    } catch (error) {
      console.error('Wishlist error:', error);
      // Revert state if the server request fails
      setFavorites(prev => 
        isCurrentlyFavorite ? [...prev, productId] : prev.filter(id => id !== productId)
      );
      toast.error('Failed to update wishlist');
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };
  
  function getPropertyLink(property) {
    if (!property || !property.id) return '/user/home';
    const type = (property.listingType || property.category || '').toLowerCase();
    if (type === 'rent') return `/user/rent/${property.id}`;
    return `/user/sale/${property.id}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    const revealElements = () => {
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach((reveal) => {
        const windowHeight = window.innerHeight;
        const elementTop = reveal.getBoundingClientRect().top;
        
        if (elementTop > windowHeight - 50) {
          // Element is below the fold — mark as pre-reveal (hidden)
          reveal.classList.add('pre-reveal');
          reveal.classList.remove('active');
        } else {
          // Element is in view — show it
          reveal.classList.remove('pre-reveal');
          reveal.classList.add('active');
        }
      });
    };
    
    // Run immediately to set initial states
    revealElements();
    
    window.addEventListener('scroll', revealElements, { passive: true });
    
    // Re-run after content loads
    const timer = setTimeout(revealElements, 100);
    const timer2 = setTimeout(revealElements, 500);
    
    return () => {
      window.removeEventListener('scroll', revealElements);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [properties]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <UserNavbar />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 pt-0 pb-6 fade-in">
        {/* Hero Section - Full-width responsive layout */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 -mx-4 sm:mx-0">
          {/* Hero Slider - takes 60% on large screens, full width on mobile */}
          <div className="w-full lg:w-[60%] relative rounded-none sm:rounded-3xl overflow-hidden h-64 sm:h-80 md:h-[380px] lg:h-[500px] sm:shadow-xl reveal flex-shrink-0">
            {heroSlides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={cloudinaryService.optimizeUrl(slide.image, { width: 1200, quality: '85' })}
                  alt={`Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchpriority={index === 0 ? "high" : "low"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 text-white max-w-md">
                  <h2 className="text-3xl font-bold mb-2 drop-shadow-lg uppercase tracking-tight">{slide.title}</h2>
                  <p className="text-gray-100 font-medium drop-shadow-md hidden md:block">{slide.subtitle}</p>
                </div>
              </div>
            ))}
            
            <button
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-gray-800 rounded-xl sm:rounded-2xl transition-all shadow-lg group"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 transition-transform group-hover:-translate-x-1" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-gray-800 rounded-xl sm:rounded-2xl transition-all shadow-lg group"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
            </button>
            
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 flex space-x-1.5 sm:space-x-2">
              {heroSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-6 sm:w-8 bg-white' : 'w-1.5 sm:w-2 bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Property Thumbnail Grid - 40% on large screens, hidden on mobile */}
          <div className="hidden lg:grid w-full lg:w-[40%] grid-cols-2 grid-rows-2 gap-3 h-[500px]">
            {loading ? (
              // Skeleton placeholders while properties load
              [...Array(4)].map((_, idx) => (
                <div key={idx} className="rounded-2xl bg-slate-200 animate-pulse" />
              ))
            ) : heroProperties.length > 0 ? (
              heroProperties.slice(0, 4).map((property, idx) => {
                const mainImg = getPropertyImage(property);
                const city = (typeof property.location === 'object' ? (property.location.city || property.location.state || property.location.address) : property.location) || 'Mumbai, India';
                const displayType = (property.propertyType || property.type || property.category || 'Property').toUpperCase();
                
                return (
                  <Link 
                    to={getPropertyLink(property)}
                    key={property.id}
                    className="h-full group relative rounded-2xl overflow-hidden shadow-lg border-2 border-white hover:shadow-2xl transition-all duration-500"
                  >
                    <img
                      src={mainImg}
                      alt={displayType}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="text-white font-bold text-xs truncate mb-0.5 uppercase tracking-wide">{displayType}</p>
                      <p className="text-primary-400 font-bold text-[10px]">
                        {(() => {
                          const val = Number(property.price || property.pricing?.price || 0);
                          const fallback = (property.listingType || property.category || property.type || '').toLowerCase() === 'rent' ? 25000 : 4500000;
                          const finalPrice = val || fallback;
                          if (finalPrice >= 10000000) return `₹${(finalPrice / 10000000).toFixed(1)}Cr`;
                          if (finalPrice >= 100000) return `₹${(finalPrice / 100000).toFixed(1)}L`;
                          return `₹${finalPrice.toLocaleString()}`;
                        })()}
                      </p>
                      <div className="flex items-center mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-white/70 mr-1" />
                        <p className="text-[9px] text-white/70 truncate">{city}</p>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // Fallback Grid when database is completely empty
              heroSlides.slice(1, 5).map((slide, idx) => (
                <div key={idx} className="h-full group relative rounded-2xl overflow-hidden shadow-lg border-2 border-white hover:shadow-2xl transition-all duration-500">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-xs truncate mb-0.5 uppercase tracking-wide">{slide.title}</p>
                    <p className="text-primary-400 font-bold text-[10px]">PREMIUM</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {dummyCategories.map((category) => {
          // Filter to match the current category
          const liveProperties = properties.filter(p => 
            p.category?.toLowerCase() === category.id || 
            p.type?.toLowerCase() === category.id
          );
          
          // Only show category if it has real database properties
          if (liveProperties.length === 0) return null;
          
          // Mix sell and rent properties so both are visible, and increase limit to 20
          const sellProps = liveProperties.filter(p => p.listingType === 'sell');
          const rentProps = liveProperties.filter(p => p.listingType === 'rent');
          
          const mixedProperties = [];
          const maxLength = Math.max(sellProps.length, rentProps.length);
          for(let i=0; i<maxLength; i++) {
            if (sellProps[i]) mixedProperties.push(sellProps[i]);
            if (rentProps[i]) mixedProperties.push(rentProps[i]);
          }
          
          const displayProperties = mixedProperties.slice(0, 20);
          
          return (
            <div key={category.id}>
              {/* Premium Property Description Section - Compact Design */}
              {category.id === 'commercial' && (
                <div className="relative w-full my-6 overflow-hidden reveal min-h-[420px] md:min-h-[380px] py-10 md:py-12 flex items-center rounded-3xl">
                  {/* High-End Background with Overlay */}
                  <div className="absolute inset-0">
                    <img 
                      src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070" 
                      alt="Modern Architecture" 
                      className="w-full h-full object-cover grayscale opacity-20"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent" />
                  </div>

                  <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-10 py-4">
                    <div className="flex flex-col items-center">
                      <div className="inline-flex items-center space-x-3 px-5 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-primary-400 text-[10px] font-bold uppercase tracking-[0.4em] mb-6 shadow-2xl">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        <span>India's Largest Real Estate Network</span>
                      </div>
                      
                      <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 uppercase tracking-tighter leading-tight text-center">
                        Redefining <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Luxury Living</span>
                      </h2>
                      
                      <div className="w-20 h-1 bg-primary-500 mb-8 rounded-full" />
                      
                      <p className="text-xs sm:text-sm md:text-base text-slate-300 font-light leading-relaxed w-full mx-auto text-center mb-8 px-2 sm:px-8 line-clamp-4 md:line-clamp-none">
                        Discover a wide range of premium real estate properties including modern apartments, luxury villas, studio homes, commercial spaces, office buildings, retail shops, farmhouses, penthouses, and investment land in top locations across India. Whether you are looking to buy, rent, invest, or expand your business, our platform offers verified properties with modern amenities, excellent connectivity, elegant designs, and high growth potential. From affordable living spaces to ultra-luxury residences and commercial opportunities, we help you find the perfect property that matches your lifestyle, budget, and future goals.
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-5xl">
                        {[
                          { label: 'Properties', val: '25,000+', icon: '🏠' },
                          { label: 'Happy Clients', val: '18,000+', icon: '👥' },
                          { label: 'Verified Listings', val: '100%', icon: '✅' },
                          { label: 'Locations', val: '50+ Cities', icon: '📍' }
                        ].map((stat, i) => (
                          <div key={i} className="flex flex-col items-center p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl transition-all hover:bg-white/10">
                            <span className="text-2xl mb-2">{stat.icon}</span>
                            <span className="text-2xl font-bold text-white mb-0.5">{stat.val}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-8 sm:mb-10 reveal">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800 uppercase tracking-widest">
                  {category.name}
                </h3>
                <Link
                  to={`/user/search?category=${category.id}`}
                  className="text-primary-600 hover:text-primary-700 text-xs font-bold uppercase tracking-widest hover-lift"
                >
                  SEE ALL
                </Link>
              </div>
              
              <div className="relative">
                <div className="overflow-x-auto pb-6 no-scrollbar scroll-smooth snap-x snap-mandatory">
                  <div className="flex gap-4 sm:gap-6 flex-nowrap">
                    {displayProperties.map((property, idx) => {
                      const mainImg = getPropertyImage(property);
                      const city = (typeof property.location === 'object' ? (property.location.city || property.location.state || property.location.address) : property.location) || 'Mumbai, India';
                      const title = property.title || property.name;
                      const pIsRent = property.listingType?.toLowerCase() === 'rent' || property.category?.toLowerCase() === 'rent' || property.listingType?.toLowerCase() === 'rental' || property.category?.toLowerCase() === 'rental';
                      
                      return (
                        <div key={property.id || idx} className="flex-shrink-0 w-[46%] sm:w-52 md:w-64 snap-start">
                          <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden hover-lift active:scale-95 transition-all shine group relative">
                            {/* Main Clickable Area */}
                            <Link to={getPropertyLink(property)} className="block">
                              <div className="relative h-40 sm:h-48">
                                <img
                                  src={mainImg}
                                  alt={title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className={`absolute top-2 left-2 px-2 py-1 text-white rounded text-[8px] sm:text-[10px] font-bold uppercase tracking-widest shadow-md ${
                                  pIsRent ? 'bg-emerald-500' : 'bg-[#2563eb]'
                                }`}>
                                  {pIsRent ? 'For Rent' : 'For Sale'}
                                </span>
                              </div>

                              <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-bold text-slate-800 line-clamp-1 text-base uppercase tracking-tight">{title}</h4>
                                  <div className="flex items-center text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                                    <Star className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                                    <span>{property.rating || 4.5}</span>
                                  </div>
                                </div>
                                <div className="flex items-center text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                                  <MapPin className="w-3.5 h-3.5 mr-1 text-primary-500" />
                                  <span className="line-clamp-1">{city}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                                  <span className="text-base font-bold text-primary-600 min-w-0 flex-1 truncate">
                                    {(() => {
                                      const val = Number(property.price || property.pricing?.price || 0);
                                      const fallback = (property.listingType || property.category || property.type || '').toLowerCase() === 'rent' ? 25000 : 4500000;
                                      const finalPrice = val || fallback;
                                      if (finalPrice >= 10000000) return `₹${(finalPrice / 10000000).toFixed(1)}Cr`;
                                      if (finalPrice >= 100000) return `₹${(finalPrice / 100000).toFixed(1)}L`;
                                      return `₹${finalPrice.toLocaleString()}`;
                                    })()}
                                  </span>
                                  <div className="flex-shrink-0 px-3 py-2 btn-gradient rounded-xl text-xs font-bold text-white uppercase shadow-lg shadow-orange-100">
                                    View
                                  </div>
                                </div>
                              </div>
                            </Link>

                            {/* Actions overlay - Keep outside the main link to prevent navigation on button click */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(property.id);
                              }}
                              className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all hover-lift z-20"
                            >
                              <Heart
                                className={`w-5 h-5 ${
                                  favorites.includes(property.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
            </div>
          );
        })}
        {/* Premium Promotional Banner */}
        <div className="relative -mx-4 sm:mx-0 rounded-none sm:rounded-[2.5rem] overflow-hidden my-10 min-h-[320px] md:min-h-[360px] py-10 sm:py-14 md:py-16 shadow-2xl reveal">
          <img 
            src={cloudinaryService.optimizeUrl("/banner.png", { width: 1400 })} 
            alt="Promotion Banner" 
            className="w-full h-full object-cover absolute inset-0"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-16 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-500/20 backdrop-blur-md border border-primary-500/30 rounded-full text-primary-400 text-[10px] font-bold uppercase tracking-widest mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
              <span>Limited Time Offer</span>
            </div>
            
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-[1.1] mb-4">
              LIST YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">PROPERTY</span> <br />
              FOR FREE <span className="text-primary-500">THIS MONTH</span>
            </h2>
            
            <p className="text-sm sm:text-xl text-slate-300 font-light leading-relaxed mb-10 max-w-md">
              Reach over 2 million potential buyers every month with our premium listing service. No hidden charges, just results.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <button className="w-full sm:w-auto px-10 py-5 bg-white text-black font-bold rounded-2xl transition-all hover:bg-primary-500 hover:text-white hover:scale-105 active:scale-95 shadow-xl shadow-black/20">
                GET STARTED NOW
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Completed Deals', val: '12K+', color: 'text-blue-600' },
            { label: 'Happy Customers', val: '25K+', color: 'text-green-600' },
            { label: 'Verified Properties', val: '8K+', color: 'text-primary-600' },
            { label: 'Expert Agents', val: '500+', color: 'text-orange-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-all group">
              <p className={`text-2xl font-bold ${stat.color} mb-1 group-hover:scale-110 transition-transform`}>{stat.val}</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-white border-t border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 py-10 sm:px-10 sm:py-16 lg:px-12 lg:py-20">

          {/* Mobile: flex-col stack, Tablet: 2-col grid, Desktop: 4-col grid */}
          <div className="flex flex-col gap-8 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-8 sm:gap-y-10">

            {/* Brand — full width on mobile, spans 2 cols on tablet */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-4">
                <img 
                  src="/homenest-logo.jpg" 
                  alt="HomeNest Logo" 
                  className="h-10 w-auto object-contain rounded-lg" 
                />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-sm">Find your dream property with us. We offer the best real estate listings across the country with premium service and verified locations.</p>
              <div className="flex flex-wrap gap-3">
                {['Facebook', 'Twitter', 'Instagram'].map(social => (
                  <a key={social} href={`#${social}`} className="text-slate-500 hover:text-primary-400 transition-colors text-[11px] font-bold uppercase tracking-wider">{social}</a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {['Home', 'Profile', 'About Us'].map(link => (
                  <li key={link}>
                    <Link to={`/user/${link.toLowerCase().replace(' ', '')}`} className="text-slate-400 hover:text-white transition-colors text-sm">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Categories</h4>
              <ul className="space-y-2.5">
                {dummyCategories.slice(0, 4).map((category) => (
                  <li key={category.id}>
                    <Link to={`/user/search?category=${category.id}`} className="text-slate-400 hover:text-white transition-colors text-sm">{category.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Us — always renders, full width on mobile */}
            <div className="sm:col-span-2 lg:col-span-1">
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-3">
                  <span className="text-base">📍</span>
                  <span>123 Real Estate Ave, NY</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-base">📧</span>
                  <span>contact@homenest.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-base">📞</span>
                  <span>+1 (555) 123-4567</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-slate-800 mt-10 pt-6 text-center text-slate-500 text-sm">
            <p>&copy; 2024 HomeNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
