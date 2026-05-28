import { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  Ban, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { firestoreService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('user');

  useEffect(() => {
    const unsubscribe = firestoreService.subscribeToUsers((data) => {
      // Show all users from Firestore (admin can filter by role)
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (userId, status) => {
    try {
      await firestoreService.updateUserStatus(userId, status);
      toast.success(`User ${status === 'blocked' ? 'blocked' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      try {
        await firestoreService.deleteUser(userId);
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Delete user error:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    const matchesRole = filterRole === 'all' || (user.role || 'user') === filterRole;
    return matchesSearch && matchesFilter && matchesRole;
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">User Management</h1>
          <p className="text-gray-500 font-medium">Monitor and manage your platform's user base.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-50 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-40">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold text-gray-600 appearance-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="vendor">Vendors</option>
              <option value="agent">Agents</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="relative flex-1 md:w-40">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl pl-10 pr-6 py-4 text-sm font-bold text-gray-600 appearance-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Info</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Activity</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence>
                {filteredUsers.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-gray-50/80 transition-all group"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                          ) : (
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                              <span className="text-indigo-600 font-black text-lg">
                                {(user.displayName || user.name)?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.status === 'blocked' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm tracking-tight">{user.displayName || user.name || 'Unnamed User'}</p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">UID: {user.id.slice(0, 8)}</p>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'vendor' || user.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>{user.role || 'user'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${
                        user.status === 'blocked' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {user.status === 'blocked' ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex flex-col items-center gap-1">
                         <span className="text-xs font-black text-gray-900 tracking-tighter">{user.totalBookings || 0}</span>
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bookings</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(user.id, user.status === 'blocked' ? 'active' : 'blocked')}
                          className={`p-2.5 rounded-xl transition-all shadow-sm border ${
                            user.status === 'blocked' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' 
                            : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'
                          }`}
                          title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}
                        >
                          {user.status === 'blocked' ? <CheckCircle2 className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2.5 bg-gray-50 border border-gray-100 text-gray-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 rounded-xl transition-all shadow-sm"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Showing <span className="text-gray-900 font-black">{filteredUsers.length}</span> of <span className="text-gray-900 font-black">{users.length}</span> Users
          </p>
          <div className="flex items-center gap-2">
            <button className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-indigo-600 transition-all shadow-sm disabled:opacity-50" disabled>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1">
              <button className="w-10 h-10 bg-indigo-500 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100">1</button>
              <button className="w-10 h-10 bg-white text-gray-500 hover:bg-indigo-50 rounded-xl font-black text-sm transition-all border border-gray-100">2</button>
            </div>
            <button className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-indigo-600 transition-all shadow-sm">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
