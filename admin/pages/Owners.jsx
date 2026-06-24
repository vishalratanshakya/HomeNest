import { useState, useEffect } from 'react';
import { 
  UserSquare2, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Trash2, 
  Mail, 
  Phone, 
  Building2, 
  DollarSign, 
  Home,
  ChevronLeft,
  ChevronRight,
  Download,
  Ban
} from 'lucide-react';
import { firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOwners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToUsers((data) => {
      setOwners(data.filter(u => u.role === 'owner' || u.role === 'agent'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (ownerId, status) => {
    try {
      await firestoreService.updateUserStatus(ownerId, status);
      toast.success(`Owner status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteOwner = async (ownerId) => {
    if (window.confirm('Delete this owner? This will remove all their property associations.')) {
      try {
        // Delete from both users and owners collections
        await firestoreService.deleteUser(ownerId);
        await firestoreService.deleteOwner(ownerId);
        toast.success('Owner removed successfully');
      } catch (error) {
        console.error('Owner deletion error:', error);
        toast.error('Failed to delete owner');
      }
    }
  };

  const filteredOwners = owners.filter(v => {
    const matchesSearch = 
      v.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Owner Management</h1>
          <p className="text-gray-500 font-medium">Verify partners and track agency performance.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <Download className="w-5 h-5" />
          <span>Report</span>
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserSquare2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Owners</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{owners.filter(v => v.status === 'active').length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending KYC</span>
          </div>
          <p className="text-2xl font-black text-gray-900">{owners.filter(v => v.status === 'pending').length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue Generated</span>
          </div>
          <p className="text-2xl font-black text-gray-900">₹{owners.reduce((acc, v) => acc + (v.revenue || 0), 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500" />
          <input
            type="text"
            placeholder="Search agencies, companies or names..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500/20 md:w-48"
        >
          <option value="all">Status: All</option>
          <option value="active">Status: Active</option>
          <option value="pending">Status: Pending</option>
          <option value="suspended">Status: Suspended</option>
        </select>
      </div>

      {/* Owner Grid/List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredOwners.map((owner, idx) => (
            <motion.div
              key={owner.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl flex items-center justify-center border border-indigo-200/20">
                    {owner.photoURL ? (
                      <img src={owner.photoURL} className="w-full h-full rounded-3xl object-cover" />
                    ) : (
                      <Building2 className="w-8 h-8 text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{owner.companyName || owner.displayName || 'Unnamed Agency'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                         owner.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 
                         owner.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                       }`}>
                         {owner.status || 'pending'}
                       </span>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">• {owner.role}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => handleUpdateStatus(owner.id, 'active')}
                     className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100/50 shadow-sm"
                   >
                     <CheckCircle2 className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => handleUpdateStatus(owner.id, 'suspended')}
                     className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100/50 shadow-sm"
                   >
                     <Ban className="w-4 h-4" />
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inventory</span>
                  </div>
                  <p className="text-sm font-black text-gray-900">{owner.propertyCount || 0} listings</p>
                </div>
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-3 h-3 text-gray-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Earnings</span>
                  </div>
                  <p className="text-sm font-black text-gray-900">₹{(owner.revenue || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-50">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <Mail className="w-4 h-4" />
                    <span>{owner.email}</span>
                  </div>
                  {owner.phone && (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span>{owner.phone}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleDeleteOwner(owner.id)}
                  className="px-6 py-3 bg-gray-50 text-gray-400 hover:bg-rose-500 hover:text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                >
                  Remove Account
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminOwners;
