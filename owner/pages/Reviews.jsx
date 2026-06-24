import React, { useState, useEffect, useMemo } from "react";
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Filter, 
  Search,
  ChevronDown,
  Reply,
  MoreVertical,
  CheckCircle2,
  Home,
  Calendar,
  Send,
  X,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import OwnerSidebar from "../components/OwnerSidebar";
import OwnerHeader from "../components/OwnerHeader";
import { authService, firestoreService } from "../../src/core/services/firebaseService";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [userLiked, setUserLiked] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = firestoreService.subscribeToReviews(
      { ownerId: user.uid },
      (data) => {
        setReviews(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error in subscribeToReviews snapshot:', error);
        setReviews([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return [
      { label: '5 Star', percentage: 0, count: 0 },
      { label: '4 Star', percentage: 0, count: 0 },
      { label: '3 Star', percentage: 0, count: 0 },
      { label: '2 Star', percentage: 0, count: 0 },
      { label: '1 Star', percentage: 0, count: 0 },
    ];

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      if (counts[r.rating] !== undefined) counts[r.rating]++;
    });

    return [
      { label: '5 Star', percentage: (counts[5] / reviews.length) * 100, count: counts[5] },
      { label: '4 Star', percentage: (counts[4] / reviews.length) * 100, count: counts[4] },
      { label: '3 Star', percentage: (counts[3] / reviews.length) * 100, count: counts[3] },
      { label: '2 Star', percentage: (counts[2] / reviews.length) * 100, count: counts[2] },
      { label: '1 Star', percentage: (counts[1] / reviews.length) * 100, count: counts[1] },
    ];
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = (review.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (review.property || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === "All") return true;
    if (filter === "5★") return review.rating === 5;
    if (filter === "4★") return review.rating === 4;
    return true;
  });

  const handleHelpful = (id) => {
    toast.success("Helpful vote updated!");
  };

  const handleReplySubmit = async (id) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    try {
      await firestoreService.updateReview(id, { reply: replyText });
      toast.success("Reply posted successfully!");
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      console.error("Error replying to review:", err);
      toast.error("Failed to post reply");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar />
      <main className="flex-1 lg:ml-72 ml-0 transition-all duration-300">
        <OwnerHeader />
        
        <div className="p-4 md:p-10 space-y-10">
          {/* HEADER SECTION */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="max-w-xl">
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Property Reviews</h1>
              <p className="text-gray-500 font-medium mt-2 text-lg">Real feedback from verified buyers and long-term tenants.</p>
              {reviews.length > 0 && (
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex -space-x-3">
                    {reviews.slice(0, 4).map((r, i) => (
                      <img key={i} className="w-10 h-10 rounded-full border-4 border-white shadow-sm" src={r.avatar || `https://ui-avatars.com/api/?name=${r.name}&background=random`} alt="" />
                    ))}
                    {reviews.length > 4 && (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 border-4 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-white">+{reviews.length - 4}</div>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-600 italic">"Trusted by global investors"</p>
                </div>
              )}
            </div>
            
            {/* RATING SUMMARY */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/5 border border-gray-100 flex flex-col md:flex-row items-center gap-10 min-w-[450px]"
            >
              <div className="text-center md:border-r border-gray-100 md:pr-10">
                <div className="relative inline-block">
                  <h2 className="text-6xl font-black text-gray-900 tracking-tighter">{averageRating}</h2>
                  <div className="absolute -top-2 -right-4 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Star className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">Overall Excellence</p>
              </div>
              <div className="flex-1 space-y-2.5 w-full">
                {stats.map((s) => (
                  <div key={s.label} className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-gray-400 w-12 uppercase">{s.label}</span>
                    <div className="flex-1 h-2 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                      />
                    </div>
                    <span className="text-[10px] font-black text-gray-600 w-8">{Math.round(s.percentage)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 -mx-4 md:-mx-10 px-4 md:px-10 py-4 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-start gap-6">
              <div className="w-full md:w-2/3 lg:w-1/2 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search by customer or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-medium text-sm"
                />
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {["All", "5★", "4★", "Latest"].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => setFilter(btn)}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                      filter === btn 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-200 scale-105' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* REVIEWS LIST */}
          <div className="space-y-8 pb-10">
            <AnimatePresence mode='popLayout'>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="mt-4 text-gray-400 font-bold">Syncing live feedback...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 text-gray-400"
                >
                  <div className="p-8 bg-gray-50 rounded-full mb-6">
                    <MessageSquare className="w-16 h-16 opacity-20" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">No Feedback Yet</h3>
                  <p className="text-sm font-medium mt-1">Refine your search or wait for new reviews to roll in.</p>
                </motion.div>
              ) : (
                filteredReviews.map((review, idx) => (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 transition-opacity" />
                    
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-10">
                      <div className="flex flex-col items-center shrink-0 w-full md:w-32">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-500">
                            <div className="w-full h-full rounded-[0.9rem] bg-white flex items-center justify-center font-black text-2xl text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-indigo-700 overflow-hidden">
                              {review.avatar ? <img src={review.avatar} className="w-full h-full object-cover" alt="" /> : (review.name || "U").charAt(0)}
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-md border border-gray-50">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                          </div>
                        </div>
                        <p className="text-sm font-black text-gray-900 mt-4 text-center leading-tight">{review.name || "Verified User"}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Verified Client</p>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-100'}`} />
                              ))}
                            </div>
                            <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              <Home className="w-3.5 h-3.5" /> Reviewed: {review.property || "Property"}
                            </h4>
                          </div>
                          <div className="px-4 py-1.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{formatDate(review.createdAt)}</span>
                          </div>
                        </div>

                        <div className="relative">
                          <p className="text-gray-700 font-medium text-lg leading-relaxed z-10 relative">
                            {review.comment}
                          </p>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleHelpful(review.id)}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border bg-gray-50 text-gray-500 border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm`}
                            >
                              <ThumbsUp className="w-3.5 h-3.5" /> 
                              {review.likes || 0} Helpful
                            </button>
                            <button 
                              onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                replyingTo === review.id
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-100'
                                  : 'bg-gray-50 text-gray-500 border-transparent hover:border-gray-200 hover:bg-white hover:shadow-sm'
                              }`}
                            >
                              <Reply className="w-3.5 h-3.5" /> 
                              {replyingTo === review.id ? 'Cancel' : 'Reply'}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {replyingTo === review.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 overflow-hidden"
                            >
                              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to ${review.name}...`}
                                  className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all min-h-[100px] resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button 
                                    onClick={() => setReplyingTo(null)}
                                    className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                                  >
                                    Dismiss
                                  </button>
                                  <button 
                                    onClick={() => handleReplySubmit(review.id)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                  >
                                    <Send className="w-3.5 h-3.5" /> Post Reply
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {review.reply && !replyingTo && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 pl-8 border-l-4 border-indigo-100"
                          >
                            <div className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100/50 relative group/reply">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Reply className="w-4 h-4 text-indigo-600" />
                                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Official Response</span>
                                </div>
                              </div>
                              <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                                "{review.reply}"
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

