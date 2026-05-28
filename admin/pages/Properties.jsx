import { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Tag, 
  Key, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const AdminProperties = ({ type = 'all' }) => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToProperties({}, (data) => {
      let filtered = data;
      // Filter by listingType or category (sell/rent)
      if (type === 'sell') filtered = data.filter(p => p.listingType === 'sell' || p.category === 'sell');
      if (type === 'rent') filtered = data.filter(p => p.listingType === 'rent' || p.category === 'rent');
      setProperties(filtered);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [type]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await firestoreService.updatePropertyStatus(id, status);
      toast.success(`Property marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this property?')) {
      try {
        await firestoreService.deleteProperty(id);
        toast.success('Property deleted');
      } catch (error) {
        toast.error('Deletion failed');
      }
    }
  };

  const filteredData = properties.filter(p => {
    const locationStr = typeof p.location === 'object' 
      ? `${p.location.address || ''} ${p.location.locality || ''} ${p.location.city || ''}`.trim()
      : (p.location || '');
      
    const matchesSearch = 
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locationStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            {type === 'all' ? 'Inventory Management' : `${type} Properties`}
          </h1>
          <p className="text-gray-500 font-medium">Verify listings and manage platform inventory.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => {
               toast.success('Generating inventory report...');
               // Logic for CSV/PDF export would go here
             }}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm group"
           >
             <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
             <span>Export</span>
           </button>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Listings</p>
            <p className="text-xl font-black text-gray-900">{properties.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved</p>
            <p className="text-xl font-black text-gray-900">{properties.filter(p => p.status === 'active').length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Featured</p>
            <p className="text-xl font-black text-gray-900">{properties.filter(p => p.isFeatured).length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by title, location or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-600 appearance-none focus:ring-2 focus:ring-indigo-500/20 md:w-48"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredData.map((property, idx) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              {/* Image Header */}
              <div className="relative h-48 overflow-hidden">
                {property.images?.[0] ? (
                  <img src={property.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-gray-300" /></div>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${
                    (property.listingType === 'sell' || property.category === 'sell') ? 'bg-indigo-600/80 text-white' : 'bg-emerald-600/80 text-white'
                  }`}>
                    {(property.listingType === 'sell' || property.category === 'sell') ? <Tag className="w-3 h-3 inline mr-1" /> : <Key className="w-3 h-3 inline mr-1" />}
                    For {property.listingType || property.category || 'sale'}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${
                    property.status === 'active' ? 'bg-emerald-50/90 text-emerald-600' : 
                    property.status === 'pending' ? 'bg-amber-50/90 text-amber-600' : 'bg-rose-50/90 text-rose-600'
                  }`}>
                    {property.status || 'pending'}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-lg font-black text-gray-900 truncate pr-4">{property.title}</h3>
                   <span className="text-lg font-black text-indigo-600 tracking-tighter">₹{Number(property.price).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-400 mb-6">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {typeof property.location === 'object' 
                      ? `${property.location.locality || property.location.city || 'No Location'}` 
                      : (property.location || 'No Location')}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50 mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm uppercase">
                         {property.vendorName?.charAt(0) || 'V'}
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor</p>
                         <p className="text-xs font-bold text-gray-900">{property.vendorName || 'Unknown'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Listed On</p>
                      <p className="text-xs font-bold text-gray-900">{property.createdAt?.toDate ? property.createdAt.toDate().toLocaleDateString() : 'New'}</p>
                   </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                   {property.status === 'pending' ? (
                     <button 
                       onClick={() => handleUpdateStatus(property.id, 'active')}
                       className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                     >
                       Approve Listing
                     </button>
                   ) : (
                     <button 
                       onClick={() => handleUpdateStatus(property.id, 'pending')}
                       className="flex-1 bg-gray-50 text-gray-500 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                     >
                       Suspend
                     </button>
                   )}
                   <div className="flex gap-2">
                      <button 
                        onClick={() => navigate(`/vendor/edit-property/${property.id}`)}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(property.id)}
                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => navigate(`/user/product/${property.id}`)}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination Placeholder */}
      <div className="flex items-center justify-between py-6">
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Showing {filteredData.length} Properties</p>
         <div className="flex gap-2">
            <button className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100">1</button>
            <button className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm transition-all"><ChevronRight className="w-5 h-5" /></button>
         </div>
      </div>
    </div>
  );
};

export default AdminProperties;
