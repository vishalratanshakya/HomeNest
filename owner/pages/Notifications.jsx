import { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Send, 
  User, 
  Building2, 
  AlertCircle, 
  Info, 
  MessageSquare,
  Globe,
  Loader2,
  ChevronRight,
  ShieldAlert,
  FileText,
  CreditCard,
  X,
  Mail,
  ArrowRight,
  Database,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, authService } from '@core/services/firebaseService';
import { 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  serverTimestamp, 
  addDoc 
} from 'firebase/firestore';
import { useNotifications } from '@core/hooks/useNotifications';
import toast from 'react-hot-toast';
import OwnerSidebar from '../components/OwnerSidebar';
import OwnerHeader from '../components/OwnerHeader';

const OwnerNotifications = () => {
  const currentUser = authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser'));
  const { notifications: liveNotifications, markAllAsRead } = useNotifications(currentUser?.uid, 'owner');
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [openSupportModal, setOpenSupportModal] = useState(false);
  const [supportData, setSupportData] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (liveNotifications) setLoading(false);
  }, [liveNotifications]);

  const handleContactAdmin = async () => {
    if (!supportData.subject || !supportData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        ownerId: currentUser?.uid,
        ownerName: currentUser?.displayName || 'Unknown Owner',
        ...supportData,
        status: 'open',
        createdAt: serverTimestamp(),
      });
      
      toast.success('Support request sent to admin panel!');
      setOpenSupportModal(false);
      setSupportData({ subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send support request');
    } finally {
      setSending(false);
    }
  };

  const quickActions = [
    { 
      id: 'support', 
      title: 'Contact Admin', 
      desc: 'Send priority support message', 
      icon: <Mail className="w-6 h-6" />, 
      color: 'bg-blue-50 text-blue-600',
      action: () => setOpenSupportModal(true)
    },
    { 
      id: 'import', 
      title: 'Bulk Property Import', 
      desc: 'Upload multiple listings via CSV', 
      icon: <Database className="w-6 h-6" />, 
      color: 'bg-indigo-50 text-indigo-600',
      action: () => toast('Bulk import tool initializing...', { icon: '🏘️' })
    },
    { 
      id: 'payout', 
      title: 'Request Payout', 
      desc: 'Withdraw your current earnings', 
      icon: <CreditCard className="w-6 h-6" />, 
      color: 'bg-emerald-50 text-emerald-600',
      action: () => toast.success('Payout request submitted for verification')
    },
    { 
      id: 'report', 
      title: 'Export My Earnings', 
      desc: 'Download monthly performance', 
      icon: <Download className="w-6 h-6" />, 
      color: 'bg-purple-50 text-purple-600',
      action: () => toast.success('Report generation started')
    },
    { 
      id: 'preferences', 
      title: 'Alert Preferences', 
      desc: 'Customize push/email alerts', 
      icon: <ShieldAlert className="w-6 h-6" />, 
      color: 'bg-amber-50 text-amber-600',
      action: () => toast('Settings panel opening...', { icon: '⚙️' })
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <OwnerSidebar />
      
      <main className="flex-1 w-full lg:ml-72 ml-0 flex flex-col h-screen overflow-y-auto transition-all duration-300 custom-scrollbar">
        <OwnerHeader />
        
        <div className="space-y-10 pb-20 p-6 lg:p-10 w-full">
          {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Notifications</h1>
          <p className="text-gray-500 font-medium mt-2">Global announcements and platform alerts.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-xs text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all"
        >
          Mark all as read
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Left Column: Notifications Feed */}
        <div className="xl:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Broadcast Feed</h2>
              <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">OWNER ALERTS</div>
           </div>
           
           <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-100 shadow-sm">
                   <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                   <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Fetching Alerts...</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                   {liveNotifications.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-100 shadow-sm">
                       <Bell className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                       <p className="text-gray-400 font-black uppercase text-xs">No active notifications</p>
                     </div>
                   ) : (
                    liveNotifications.map((n, idx) => (
                       <motion.div
                         key={n.id}
                         layout
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className={`bg-white p-6 rounded-[2.5rem] shadow-sm border ${!n.read ? 'border-blue-100 bg-blue-50/10' : 'border-gray-50'} flex items-start gap-6 group hover:shadow-lg transition-all duration-300`}
                       >
                          <div className={`p-5 rounded-[1.5rem] ${
                            n.type === 'system' ? 'bg-rose-50 text-rose-600' : 
                            n.type === 'alert' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                             {n.type === 'system' ? <AlertCircle className="w-7 h-7" /> : 
                              n.type === 'alert' ? <ShieldAlert className="w-7 h-7" /> : <Info className="w-7 h-7" />}
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <h3 className="font-black text-gray-900 text-lg tracking-tight leading-tight">{n.title}</h3>
                                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Platform Broadcast</p>
                                </div>
                                {!n.read && <div className="w-2 h-2 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />}
                             </div>
                             <p className="text-sm font-medium text-gray-500 leading-relaxed mt-3">{n.message}</p>
                          </div>
                       </motion.div>
                     ))
                   )}
                </AnimatePresence>
              )}
           </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="space-y-8">
           <div>
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Owner Operations</h2>
              <div className="bg-white rounded-[28px] shadow-sm p-6 border border-gray-50 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
                    {quickActions.map((action) => (
                      <motion.div
                        key={action.id}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className="flex items-center justify-between bg-gray-50 hover:bg-blue-50 rounded-2xl p-5 transition-all duration-300 cursor-pointer group hover:shadow-lg border border-transparent hover:border-blue-100"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${action.color}`}>
                               {action.icon}
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{action.title}</h4>
                               <p className="text-[10px] font-bold text-gray-400 group-hover:text-blue-400 mt-0.5">{action.desc}</p>
                            </div>
                         </div>
                         <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Platform Status */}
           <div className="bg-[#121564] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Service Status</h3>
                 <p className="text-xs font-bold text-white/60 mb-8 pr-10">Platform services are monitored 24/7 for stability.</p>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Search Engine</span>
                       </div>
                       <span className="text-[9px] font-black text-emerald-400 uppercase">Operational</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Payout System</span>
                       </div>
                       <span className="text-[9px] font-black text-emerald-400 uppercase">Operational</span>
                    </div>
                 </div>
              </div>
              <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-white/5 rounded-full blur-3xl" />
           </div>
        </div>
      </div>

      {/* Support Modal */}
      <AnimatePresence>
        {openSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpenSupportModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl overflow-hidden"
            >
               <button onClick={() => setOpenSupportModal(false)} className="absolute top-8 right-8 p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <X className="w-6 h-6" />
               </button>
               
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                     <Mail className="w-8 h-8" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Contact Admin</h2>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority Owner Support</p>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Subject</label>
                     <input 
                      type="text" value={supportData.subject} onChange={(e) => setSupportData(p => ({ ...p, subject: e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/10 focus:bg-white rounded-[1.5rem] px-8 py-5 font-bold text-sm outline-none transition-all" 
                      placeholder="e.g. Inquiry about recent payout" 
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Message Content</label>
                     <textarea 
                      value={supportData.message} onChange={(e) => setSupportData(p => ({ ...p, message: e.target.value }))}
                      className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-600/10 focus:bg-white rounded-[1.5rem] px-8 py-5 font-medium text-sm h-48 outline-none transition-all resize-none" 
                      placeholder="Describe your issue or request in detail..." 
                     />
                  </div>
                  <button 
                    onClick={handleContactAdmin} disabled={sending}
                    className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-blue-100 flex items-center justify-center gap-4 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                     {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                     {sending ? 'Sending Request...' : 'Submit Support Ticket'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default OwnerNotifications;
