import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dummyProducts } from '@core/utils/dummyData';
import { MapPin, Star, Heart, Share2, Bed, Bath, Maximize, Calendar, Phone, Mail, ChevronLeft, ChevronRight, ZoomIn, FileText, Wind, Shield, Coffee, MessageSquare } from 'lucide-react';
import { authService, firestoreService } from '@core/services/firebaseService';
import { cloudinaryService } from '@core/services/cloudinaryService';
import { notificationService } from '@core/services/notificationService';
import UserNavbar from '../components/UserNavbar';
import toast from 'react-hot-toast';

export default function UserProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const handleNextImage = () => {
    setSelectedImage(prev => (prev + 1) % product.images.length);
  };

  const handlePrevImage = () => {
    setSelectedImage(prev => (prev - 1 + product.images.length) % product.images.length);
  };

  const handleMessageVendor = async () => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error("Please login to message the vendor");
      navigate('/auth/login');
      return;
    }

    try {
      const convoData = {
        vendorId: product.vendorId,
        vendorName: vendor?.name || 'Property Vendor',
        vendorAvatar: vendor?.avatar || 'https://i.pravatar.cc/150?u=' + product.vendorId,
        vendorPhone: product.vendorPhone,
        vendorEmail: product.vendorEmail,
        userId: user.uid,
        userName: user.displayName || 'Interested Buyer',
        userAvatar: user.photoURL,
        propertyId: product.id,
        propertyName: product.name,
        propertyPrice: `₹${Number(product.price).toLocaleString()}${product.listingType?.toLowerCase() === 'rent' || product.category?.toLowerCase() === 'rent' ? '/mo' : ''}`
      };

      const msgData = {
        text: `Hi, I am interested in your property: ${product.name}. Please provide more details.`,
        sender: 'user', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      await firestoreService.sendMessage(convoData, msgData);
      navigate('/user/messages');
    } catch (err) {
      console.error("Message error:", err);
      toast.error("Failed to send message");
    }
  };

  const handleCallVendor = () => {
    const phone = product.vendorPhone || '+919988776655';
    window.location.href = `tel:${phone}`;
  };



  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToProperties({ status: 'active' }, (data) => {
      setProducts(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        let foundProperty = null;
        
        try {
          foundProperty = await firestoreService.getProperty(id);
        } catch (fetchErr) {
          console.error('Firestore fetch error:', fetchErr);
        }

        if (!foundProperty) {
          foundProperty = dummyProducts.find(p => p.id === id);
        }

        if (foundProperty) {
          const mapped = mapToProduct(foundProperty);
          setProduct(mapped);

          // Check if favorite
          const user = authService.getCurrentUser();
          if (user) {
            try {
              const wishlist = await firestoreService.getUserWishlist(user.uid);
              setIsFavorite(wishlist.includes(id));
              setFavorites(wishlist);
            } catch (err) {
              console.error("Error checking wishlist:", err);
            }
          } else {
            setIsFavorite(false);
            setFavorites([]);
          }
          
          let actualVendor = null;
          if (foundProperty.vendorId) {
            try {
              const vendorDoc = await firestoreService.getUserDocument(foundProperty.vendorId);
              if (vendorDoc) {
                const vName = vendorDoc.fullName || vendorDoc.displayName || vendorDoc.name || foundProperty.vendorName || 'Property Vendor';
                actualVendor = {
                  id: foundProperty.vendorId,
                  name: vName,
                  avatar: vendorDoc.photoURL || vendorDoc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(vName)}&background=0D8ABC&color=fff`,
                  rating: vendorDoc.rating || 5.0,
                  totalSales: vendorDoc.totalSales || foundProperty.vendorSales || 0,
                  phone: vendorDoc.phone || vendorDoc.phoneNumber || foundProperty.vendorPhone,
                  email: vendorDoc.email || foundProperty.vendorEmail
                };
              }
            } catch (vErr) {
              console.error("Error fetching vendor profile:", vErr);
            }
          }

          if (!actualVendor) {
            const vName = foundProperty.vendorName || 'Property Vendor';
            actualVendor = { 
              id: foundProperty.vendorId || 'V001', 
              name: vName, 
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(vName)}&background=0D8ABC&color=fff`,
              rating: 5.0,
              totalSales: foundProperty.vendorSales || 0,
              phone: foundProperty.vendorPhone || '+91 9988776655',
              email: foundProperty.vendorEmail || 'agent@example.com'
            };
          }
            
          setVendor(actualVendor);
          setSelectedImage(0);
          window.scrollTo(0, 0);
        } else {
          setError('Property not found.');
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError('Failed to load property details.');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);



  const mapToProduct = (data) => {
    const city = typeof data.location === 'object' ? data.location.city : (data.city || data.location || 'City');
    const address = typeof data.location === 'object' ? data.location.address : (data.address || 'Address not provided');
    const state = typeof data.location === 'object' ? data.location.state : (data.state || "");
    
    let allImages = [];
    const isValid = (url) => url && !url.includes('meganods') && !url.includes('placeholder');

    if (isValid(data.mainImage)) allImages.push(data.mainImage);
    if (data.subImages && Array.isArray(data.subImages)) {
      data.subImages.forEach(img => { if (isValid(img)) allImages.push(img); });
    }
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach(img => { if (isValid(img)) allImages.push(img); });
    }
    
    if (allImages.length === 0) allImages = ['https://placehold.co/1200x800/e2e8f0/64748b?text=No+Image'];

    return {
      ...data,
      name: data.title || data.name,
      shortDescription: data.shortDescription || data.description?.substring(0, 80) + "...",
      category: data.type || data.category || 'Property',
      rating: data.rating || 4.5,
      location: { address, city, state },
      price: data.price || 0,
      description: data.description || 'No description provided.',
      specifications: {
        bedrooms: data.bhk || data.bedrooms || data.specifications?.bedrooms || 2,
        bathrooms: data.bathrooms || data.specifications?.bathrooms || 2,
        area: data.area || data.specifications?.area || '1200 sqft',
        balcony: data.balcony || data.specifications?.balcony || '1',
        parking: data.parking || data.specifications?.parking || 'Yes',
        furnished: data.furnishing || data.specifications?.furnished || 'Semi-Furnished'
      },
      images: allImages,
      vendorId: data.vendorId || 'V001',
      vendorPhone: data.vendorPhone || data.phone || '+91 9988776655',
      vendorEmail: data.vendorEmail || data.email || 'agent@example.com'
    };
  };

  const getPropertyLink = (property) => {
    const type = (property.listingType || property.category || '').toLowerCase();
    return type === 'rent' ? `/user/rent/${property.id}` : `/user/sale/${property.id}`;
  };

  const toggleFavorite = async (productId) => {
    const user = authService.getCurrentUser();
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    const isCurrentlyFavorite = favorites.includes(productId);

    // Optimistic UI update
    setFavorites(prev => 
      !isCurrentlyFavorite ? [...prev, productId] : prev.filter(fId => fId !== productId)
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
        isCurrentlyFavorite ? [...prev, productId] : prev.filter(fId => fId !== productId)
      );
      toast.error('Failed to update wishlist');
    }
  };

  const FacilitiesGrid = () => (
    <div className="bg-slate-50/50 rounded-[2rem] p-8 border border-slate-100 h-fit">
      <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider mb-6">Property Facilities</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="flex flex-col gap-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
            <Bed className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BHK</span>
          <span className="text-lg font-black text-slate-900">{product.specifications.bedrooms}</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
            <Bath className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bathrooms</span>
          <span className="text-lg font-black text-slate-900">{product.specifications.bathrooms}</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
            <Maximize className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Area</span>
          <span className="text-lg font-black text-slate-900">{product.specifications.area}</span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
            <Wind className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balcony</span>
          <span className="text-lg font-black text-slate-900">{product.specifications.balcony}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parking</p>
            <p className="text-sm font-black text-slate-900">{product.specifications.parking}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Furnishing</p>
            <p className="text-sm font-black text-slate-900">{product.specifications.furnished}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen bg-white font-['Inter']">
      <UserNavbar />
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Not Found</h2>
        <button onClick={() => navigate('/user/home')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold mt-4">Back to Home</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      <UserNavbar />

      <main className="max-w-[1440px] mx-auto px-4 pt-1 pb-6 sm:px-6 lg:px-8 sm:pt-2">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Search
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* LEFT COLUMN: IMAGES & FACILITIES */}
          <div className="w-full lg:w-[62%] flex flex-col gap-8">
            {/* Main Image */}
            <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-100 group">
              <img 
                src={cloudinaryService.optimizeUrl(product.images[selectedImage], { width: 1200, quality: '90' })} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt="Main"
                fetchpriority="high"
              />
              {/* Navigation Buttons */}
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={handlePrevImage}
                  className="p-3 bg-white/80 backdrop-blur-md text-slate-900 rounded-full shadow-xl hover:bg-white transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={handleNextImage}
                  className="p-3 bg-white/80 backdrop-blur-md text-slate-900 rounded-full shadow-xl hover:bg-white transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={async () => {
                    const user = authService.getCurrentUser();
                    if (!user) {
                      toast.error("Please login to add to wishlist");
                      navigate('/auth/login');
                      return;
                    }
                    
                    try {
                      const isAdded = await firestoreService.toggleWishlist(user.uid, id);
                      setIsFavorite(isAdded);
                      
                      if (isAdded) {
                        toast.success("Added to wishlist!", {
                          icon: '❤️',
                          style: {
                            borderRadius: '16px',
                            background: '#333',
                            color: '#fff',
                          },
                        });
                      } else {
                        toast.success("Removed from wishlist", {
                          icon: '💔',
                        });
                      }
                    } catch (error) {
                      console.error("Wishlist error:", error);
                      toast.error("Failed to update wishlist");
                    }
                  }}
                  className={`p-2.5 backdrop-blur-md rounded-xl shadow-lg transition-all hover:scale-110 ${
                    isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2.5 bg-white/80 backdrop-blur-md text-slate-600 rounded-xl shadow-lg hover:bg-white transition-all hover:scale-110">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Slider (Thumbnails) */}
            <div className="relative group/thumbs">
              <div id="thumbnail-slider" className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x scroll-smooth">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-24 sm:w-32 aspect-square rounded-2xl overflow-hidden border-2 transition-all snap-start ${
                      selectedImage === idx ? 'border-blue-600 scale-105 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={cloudinaryService.optimizeUrl(img, { width: 150, height: 150, crop: 'fill' })} 
                      className="w-full h-full object-cover" 
                      alt={`Thumb ${idx}`} 
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>

              {/* Thumb Navigation Buttons */}
              <button 
                onClick={() => {
                  const el = document.getElementById('thumbnail-slider');
                  el.scrollLeft -= 200;
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 bg-white text-slate-900 rounded-full shadow-lg border border-slate-100 opacity-0 group-hover/thumbs:opacity-100 transition-all hover:bg-slate-50 active:scale-95 hidden sm:flex"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('thumbnail-slider');
                  el.scrollLeft += 200;
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 bg-white text-slate-900 rounded-full shadow-lg border border-slate-100 opacity-0 group-hover/thumbs:opacity-100 transition-all hover:bg-slate-50 active:scale-95 hidden sm:flex"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Property Facilities (Hidden on mobile, shown on desktop) */}
            <div className="hidden lg:block">
              <FacilitiesGrid />
            </div>
          </div>

          {/* RIGHT COLUMN: PROPERTY INFO */}
          <div className="w-full lg:w-[38%] flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-100">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <Star className="w-4 h-4 text-orange-500 fill-current" />
                  <span className="text-sm font-black text-slate-900">{product.rating}</span>
                </div>
              </div>

              <h1 className="text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                {product.name}
              </h1>

              {vendor && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Listed By</span>
                  <span className="text-sm font-black text-blue-600 uppercase tracking-tight">{vendor.name}</span>
                </div>
              )}

              <div className="flex items-baseline gap-2 pt-2">
                <span className="text-4xl font-black text-blue-600">
                  ₹{Number(product.price).toLocaleString()}
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">/ Negotiable</span>
              </div>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-base text-slate-500 font-medium leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Main Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">About this property</h3>
                <p className="text-sm leading-[1.8] text-slate-500 font-medium">
                  {product.description}
                </p>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 mt-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Address</p>
                  <p className="text-sm font-bold text-slate-900">
                    {product.location.address}, {product.location.city}, {product.location.state}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-4 mt-4">
                {(product.listingType?.toLowerCase() === 'rent' || 
                  product.category?.toLowerCase() === 'rent' ||
                  product.listingType?.toLowerCase() === 'rental' ||
                  product.category?.toLowerCase() === 'rental') ? (
                  <button 
                    onClick={() => {
                      const user = authService.getCurrentUser();
                      if (!user) {
                        toast.error("Please login to rent this property");
                        navigate('/auth/login', { state: { from: `/user/purchase-property/${product.id}`, product } });
                        return;
                      }
                      navigate(`/user/purchase-property/${product.id}`, { state: { product } });
                    }}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all hover-lift active:scale-95"
                  >
                    Rent Property
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        const user = authService.getCurrentUser();
                        if (!user) {
                          toast.error("Please login to book this property");
                          navigate('/auth/login', { state: { from: `/user/confirm-booking/${product.id}`, product } });
                          return;
                        }
                        navigate(`/user/confirm-booking/${product.id}`, { state: { product } });
                      }}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all hover-lift active:scale-95"
                    >
                      Book Property
                    </button>
                    <button 
                      onClick={() => {
                        const user = authService.getCurrentUser();
                        if (!user) {
                          toast.error("Please login to buy this property");
                          navigate('/auth/login', { state: { from: `/user/purchase-property/${product.id}`, product } });
                          return;
                        }
                        navigate(`/user/purchase-property/${product.id}`, { state: { product } });
                      }}
                      className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all hover-lift active:scale-95"
                    >
                     Buy Property
                    </button>
                  </>
                )}
              </div>

              {/* Property Facilities (Shown on mobile under buttons, hidden on desktop) */}
              <div className="block lg:hidden mt-4">
                <FacilitiesGrid />
              </div>
            </div>

            {/* Vendor Info Card */}
            {vendor && (
              <div className="mt-4 p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Listing Expert</p>
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img src={vendor.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 group-hover:border-blue-600 transition-colors" alt="Agent" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{vendor.name}</p>
                    <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{vendor.totalSales} Properties Managed</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button 
                    onClick={handleCallVendor}
                    className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-900 rounded-2xl text-xs font-black border border-slate-100 hover:bg-slate-100 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    CALL
                  </button>
                  <button 
                    onClick={handleMessageVendor}
                    className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-900 rounded-2xl text-xs font-black border border-slate-100 hover:bg-slate-100 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    MESSAGE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Properties Section */}
        <div className="mt-20 pt-12 border-t border-slate-50">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Similar Properties</h3>
            <Link to="/user/search" className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest border-b-2 border-blue-100 pb-1">See All</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products
              .filter(p => p.id !== product.id)
              .filter(p => {
                const pIsRent = p.listingType?.toLowerCase() === 'rent' || p.category?.toLowerCase() === 'rent' || p.listingType?.toLowerCase() === 'rental' || p.category?.toLowerCase() === 'rental';
                const currentIsRent = product.listingType?.toLowerCase() === 'rent' || product.category?.toLowerCase() === 'rent' || product.listingType?.toLowerCase() === 'rental' || product.category?.toLowerCase() === 'rental';
                return pIsRent === currentIsRent;
              })
              .slice(0, 4)
              .map((p, idx) => {
                const mainImg = p.mainImage || (p.images && p.images[0]) || 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
                const pIsRent = p.listingType?.toLowerCase() === 'rent' || p.category?.toLowerCase() === 'rent' || p.listingType?.toLowerCase() === 'rental' || p.category?.toLowerCase() === 'rental';
                return (
                  <Link 
                    to={getPropertyLink(p)}
                    key={p.id}
                    className="group bg-white rounded-[2rem] overflow-hidden border border-slate-50 shadow-sm hover:shadow-xl transition-all duration-500 hover-lift"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 group">
                      <img 
                        src={cloudinaryService.optimizeUrl(mainImg, { width: 400, height: 300, crop: 'fill' })} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={p.title} 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <span className={`absolute top-3 left-3 px-2.5 py-1 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-md ${
                        pIsRent ? 'bg-emerald-500' : 'bg-[#2563eb]'
                      }`}>
                        {pIsRent ? 'For Rent' : 'For Sale'}
                      </span>
                      
                      <span className="absolute bottom-4 left-4 px-3 py-1 bg-primary-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg">
                        {p.category || p.type}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(p.id);
                        }}
                        className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl hover:bg-white transition-all hover-lift z-20"
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favorites.includes(p.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-slate-800 line-clamp-1 text-base uppercase tracking-tight group-hover:text-primary-600 transition-colors">{p.title || p.name}</h4>
                        <div className="flex items-center text-sm font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 text-orange-500 fill-current mr-1" />
                          <span>{p.rating || 4.5}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-primary-500" />
                        <span className="line-clamp-1">{typeof p.location === 'object' ? p.location.city : (p.location || 'Location')}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-50">
                        <span className="text-base font-bold text-primary-600 min-w-0 flex-1 truncate">
                          {(() => {
                            const priceVal = Number(p.price);
                            if (!priceVal) return 'Contact';
                            if (priceVal >= 10000000) return `₹${(priceVal / 10000000).toFixed(1)}Cr`;
                            if (priceVal >= 100000) return `₹${(priceVal / 100000).toFixed(1)}L`;
                            return `₹${(priceVal / 1000).toFixed(0)}k`;
                          })()}
                        </span>
                        <div className="flex-shrink-0 px-3 py-2 btn-gradient rounded-xl text-xs font-bold text-white uppercase shadow-lg shadow-orange-100">
                          View
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}
