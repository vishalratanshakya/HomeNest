import { useState, useEffect } from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  User, 
  Home, 
  Calendar,
  MoreVertical,
  ThumbsUp,
  MessageSquare,
  MapPin
} from 'lucide-react';
import { firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToReviews(
      {}, // Empty filter = get all reviews for admin
      (data) => {
        setReviews(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching admin reviews:', error);
        setReviews([]);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleApprove = async (id) => {
    try {
      await firestoreService.updateReview(id, { status: 'approved' });
      toast.success('Review approved and visible to public');
    } catch (err) {
      toast.error('Failed to approve review');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this review?')) {
      try {
        await firestoreService.deleteReview(id);
        toast.success('Review removed');
      } catch (err) {
        toast.error('Failed to delete review');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Review Management</h1>
          <p className="text-gray-500 font-medium">Moderate user feedback and property ratings.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500" />
          <input
            type="text"
            placeholder="Search reviews by user or property..."
            className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-600 appearance-none focus:ring-2 focus:ring-indigo-500/20 md:w-48">
          <option>All Ratings</option>
          <option>5 Stars</option>
          <option>4 Stars</option>
          <option>3 Stars & Below</option>
        </select>
      </div>

      {/* Review Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
          <p className="mt-4 text-gray-400 font-bold">Syncing reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-gray-400">
          <MessageSquare className="w-16 h-16 opacity-20 mb-4" />
          <h3 className="text-xl font-black text-gray-900">No Reviews Found</h3>
          <p className="text-sm font-medium mt-1">There are no user reviews in the database yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {reviews.map((review, idx) => {
              const userName = review.userName || review.name || 'Verified Client';
              const propertyName = review.propertyName || review.property || 'Property';
              const imageUrl = review.image || review.avatar || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=100';
              const reviewDate = review.date || (review.createdAt ? formatDate(review.createdAt) : 'Just now');

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 flex flex-col justify-between group hover:shadow-xl transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                             <User className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                             <h4 className="font-black text-gray-900 text-sm">{userName}</h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{reviewDate}</p>
                          </div>
                       </div>
                       <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                          ))}
                       </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl mb-6">
                       <img src={imageUrl} className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                       <div>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Property</p>
                          <h5 className="font-black text-gray-900 text-xs">{propertyName}</h5>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 font-bold">
                             <MapPin className="w-3 h-3" />
                             <span>Prime Location</span>
                          </div>
                       </div>
                    </div>

                    <p className="text-sm font-medium text-gray-600 leading-relaxed italic mb-8">
                      "{review.comment}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                     <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                       review.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                     }`}>
                       {review.status || 'pending'}
                     </span>
                     <div className="flex gap-2">
                        {review.status !== 'approved' && (
                          <button 
                            onClick={() => handleApprove(review.id)}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(review.id)}
                          className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-200 transition-all">
                           <AlertCircle className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
