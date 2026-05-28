import { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Plus, 
  Send, 
  User, 
  Building2, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  MoreVertical, 
  Trash2, 
  Mail, 
  MessageSquare,
  Globe,
  Trash,
  Loader2,
  ChevronRight,
  ShieldAlert,
  FileText,
  CreditCard,
  UserX,
  Home,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@core/services/firebaseService';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  getDocs,
  doc 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Quick Action Modals
  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [openSMSModal, setOpenSMSModal] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [smsData, setSmsData] = useState({ message: '' });

  // Modal Form State for Push
  const [newBroadcast, setNewBroadcast] = useState({
    title: '',
    message: '',
    audience: 'all',
    type: 'system'
  });

  // Fetch broadcasts in real-time
  useEffect(() => {
    const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().createdAt?.toDate() ? new Date(doc.data().createdAt.toDate()).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) : 'Just now'
      }));
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSendBroadcast = async () => {
    if (!newBroadcast.title || !newBroadcast.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const broadcastRef = await addDoc(collection(db, 'broadcasts'), {
        ...newBroadcast,
        status: 'sent',
        createdAt: serverTimestamp(),
      });

      const audienceMap = {
        'all': 'all',
        'users': 'user',
        'vendors': 'vendor'
      };

      await addDoc(collection(db, 'notifications'), {
        userId: audienceMap[newBroadcast.audience] || 'all',
        title: newBroadcast.title,
        message: newBroadcast.message,
        type: newBroadcast.type,
        createdAt: serverTimestamp(),
        read: false,
        isBroadcast: true,
        broadcastId: broadcastRef.id
      });
      
      toast.success('Broadcast sent and published successfully!');
      setIsCreating(false);
      setNewBroadcast({ title: '', message: '', audience: 'all', type: 'system' });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      // Fetch all vendor emails
      const q = query(collection(db, 'users'), where('role', '==', 'vendor'));
      const snapshot = await getDocs(q);
      const emails = snapshot.docs.map(doc => doc.data().email).filter(e => e);
      
      console.log('Sending emails to:', emails);
      
      // Simulate API call to Resend/Nodemailer/etc.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully queued ${emails.length} emails for delivery!`);
      setOpenEmailModal(false);
      setEmailData({ subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to process bulk email');
    } finally {
      setSending(false);
    }
  };

  const handleSendBulkSMS = async () => {
    if (!smsData.message) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      // Simulate Twilio API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('SMS broadcast initiated successfully!');
      setOpenSMSModal(false);
      setSmsData({ message: '' });
    } catch (error) {
      toast.error('SMS API connection failed');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'broadcasts', id));
      const q = query(collection(db, 'notifications'), where('broadcastId', '==', id));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);
      toast.success('Broadcast and associated notifications removed');
    } catch (error) {
      toast.error('Failed to delete broadcast');
    }
  };

  const quickActions = [
    { 
      id: 'email', 
      title: 'Email All Vendors', 
      desc: 'Send announcement updates', 
      icon: <Mail className="w-6 h-6" />, 
      color: 'bg-blue-50 text-blue-600',
      action: () => setOpenEmailModal(true)
    },
    { 
      id: 'sms', 
      title: 'SMS Platform Alert', 
      desc: 'Notify all vendors/users', 
      icon: <MessageSquare className="w-6 h-6" />, 
      color: 'bg-amber-50 text-amber-600',
      action: () => setOpenSMSModal(true)
    },
    { 
      id: 'push', 
      title: 'Push Notification', 
      desc: 'Send realtime notifications', 
      icon: <Bell className="w-6 h-6" />, 
      color: 'bg-indigo-50 text-indigo-600',
      action: () => setIsCreating(true)
    },
    { 
      id: 'approve', 
      title: 'Approve Pending Properties', 
      desc: 'Review 5 new listings', 
      icon: <Home className="w-6 h-6" />, 
      color: 'bg-emerald-50 text-emerald-600',
      action: () => toast('Redirecting to Approval Panel...', { icon: '🏘️' })
    },
    { 
      id: 'suspend', 
      title: 'Suspend Vendor', 
      desc: 'Restrict access for policy violations', 
      icon: <UserX className="w-6 h-6" />, 
      color: 'bg-rose-50 text-rose-600',
      action: () => toast('User management access required.', { icon: '👤' })
    },
    { 
      id: 'report', 
      title: 'Generate Report', 
      desc: 'Full platform audit trail', 
      icon: <FileText className="w-6 h-6" />, 
      color: 'bg-purple-50 text-purple-600',
      action: () => toast.success('Report generation started')
    },
    { 
      id: 'payment', 
      title: 'Release Vendor Payment', 
      desc: 'Authorize 12 pending payouts', 
      icon: <CreditCard className="w-6 h-6" />, 
      color: 'bg-slate-50 text-slate-600',
      action: () => toast('Financial module authentication needed.', { icon: '💳' })
    },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Command Center</h1>
          <p className="text-gray-500 font-medium mt-2">Manage communications and administrative operations.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
           >
             <Plus className="w-5 h-5" />
             <span>New Broadcast</span>
           </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        
        {/* Left Column: Notifications Feed */}
        <div className="xl:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Recent Broadcasts</h2>
              <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">LIVE FEED</div>
           </div>
           
           <div className="space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-100 shadow-sm">
                   <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                   <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Synchronizing Broadcasts...</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                   {notifications.length === 0 ? (
                     <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-100 shadow-sm">
                       <Globe className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                       <p className="text-gray-400 font-black uppercase text-xs">No active broadcasts found</p>
                     </div>
                   ) : (
                     notifications.map((n, idx) => (
                       <motion.div
                         key={n.id}
                         layout
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-start gap-6 group hover:shadow-lg transition-all duration-300"
                       >
                          <div className={`p-5 rounded-[1.5rem] ${
                            n.type === 'system' ? 'bg-rose-50 text-rose-600' : 
                            n.type === 'alert' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                             {n.type === 'system' ? <AlertCircle className="w-7 h-7" /> : 
                              n.type === 'alert' ? <ShieldAlert className="w-7 h-7" /> : <Info className="w-7 h-7" />}
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between items-start mb-2">
                                <div>
                                   <h3 className="font-black text-gray-900 text-lg tracking-tight leading-tight">{n.title}</h3>
                                   <div className="flex items-center gap-3 mt-1.5">
                                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{n.date}</span>
                                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Audience: {n.audience}</span>
                                   </div>
                                </div>
                                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                  n.status === 'sent' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {n.status}
                                </div>
                             </div>
                             <p className="text-sm font-medium text-gray-500 leading-relaxed pr-10 mt-3">{n.message}</p>
                          </div>
                          <button 
                           onClick={() => handleDelete(n.id)}
                           className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                          >
                             <Trash2 className="w-5 h-5" />
                          </button>
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
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Quick Operations</h2>
              <div className="bg-white rounded-[28px] shadow-sm p-6 border border-gray-50 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
                    {quickActions.map((action) => (
                      <motion.div
                        key={action.id}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.action}
                        className="flex items-center justify-between bg-gray-50 hover:bg-indigo-50 rounded-2xl p-5 transition-all duration-300 cursor-pointer group hover:shadow-lg border border-transparent hover:border-indigo-100"
                      >
                         <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${action.color}`}>
                               {action.icon}
                            </div>
                            <div>
                               <h4 className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{action.title}</h4>
                               <p className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-400 mt-0.5">{action.desc}</p>
                            </div>
                         </div>
                         <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Reach Stats */}
           <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Push Reach</h3>
                 <p className="text-xs font-bold text-indigo-100 mb-8 opacity-80 pr-10">Instantly alert your entire user base or specific segments via FCM.</p>
                 <div className="space-y-6">
                    <div>
                       <div className="flex justify-between text-[11px] font-black uppercase mb-2">
                          <span className="flex items-center gap-2"><User className="w-3 h-3" /> User Delivery</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-lg">85.4%</span>
                       </div>
                       <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-emerald-400 h-full rounded-full w-[85.4%] shadow-[0_0_10px_rgba(52,211,153,0.5)]" /></div>
                    </div>
                    <div>
                       <div className="flex justify-between text-[11px] font-black uppercase mb-2">
                          <span className="flex items-center gap-2"><Building2 className="w-3 h-3" /> Vendor Delivery</span>
                          <span className="bg-white/20 px-2 py-0.5 rounded-lg">98.2%</span>
                       </div>
                       <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-emerald-400 h-full rounded-full w-[98.2%] shadow-[0_0_10px_rgba(52,211,153,0.5)]" /></div>
                    </div>
                 </div>
              </div>
              <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
           </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {/* New Broadcast Modal */}
        {isCreating && (
          <ModalWrapper onClose={() => setIsCreating(false)}>
             <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter mb-8">Draft Broadcast</h2>
             <div className="space-y-6">
                <InputGroup label="Message Title" value={newBroadcast.title} onChange={(val) => setNewBroadcast(p => ({ ...p, title: val }))} placeholder="e.g. Maintenance Alert" />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Audience</label>
                   <div className="flex gap-4">
                      {['all', 'users', 'vendors'].map((aud) => (
                        <button 
                          key={aud}
                          onClick={() => setNewBroadcast(prev => ({ ...prev, audience: aud }))}
                          className={`flex-1 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border transition-all ${
                            newBroadcast.audience === aud 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100' 
                            : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'
                          }`}
                        >
                          {aud}
                        </button>
                      ))}
                   </div>
                </div>
                <TextAreaGroup label="Content Message" value={newBroadcast.message} onChange={(val) => setNewBroadcast(p => ({ ...p, message: val }))} placeholder="Write your announcement..." />
                <ActionButton onClick={handleSendBroadcast} loading={sending} icon={<Send className="w-5 h-5" />} label={sending ? 'Broadcasting...' : 'Send Broadcast Now'} />
             </div>
          </ModalWrapper>
        )}

        {/* Bulk Email Modal */}
        {openEmailModal && (
          <ModalWrapper onClose={() => setOpenEmailModal(false)}>
             <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                   <Mail className="w-8 h-8" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Email Vendors</h2>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mass mailing via SMTP/Cloud</p>
                </div>
             </div>
             <div className="space-y-6">
                <InputGroup label="Subject Line" value={emailData.subject} onChange={(val) => setEmailData(p => ({ ...p, subject: val }))} placeholder="Enter email subject..." />
                <TextAreaGroup label="Email Body" value={emailData.message} onChange={(val) => setEmailData(p => ({ ...p, message: val }))} placeholder="Compose your vendor announcement..." height="h-48" />
                <ActionButton onClick={handleSendBulkEmail} loading={sending} icon={<Mail className="w-5 h-5" />} label={sending ? 'Sending Emails...' : 'Send Email To All Vendors'} color="bg-blue-600" />
             </div>
          </ModalWrapper>
        )}

        {/* SMS Modal */}
        {openSMSModal && (
          <ModalWrapper onClose={() => setOpenSMSModal(false)}>
             <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                   <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">SMS Platform Alert</h2>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notify all stakeholders via SMS</p>
                </div>
             </div>
             <div className="space-y-6">
                <TextAreaGroup label="Message Content (MAX 160 Characters)" value={smsData.message} onChange={(val) => setSmsData(p => ({ ...p, message: val }))} placeholder="Type critical update..." height="h-32" />
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                   <ShieldAlert className="w-4 h-4" />
                   <p className="text-[10px] font-bold uppercase">SMS Charges will apply based on Twilio API Plan</p>
                </div>
                <ActionButton onClick={handleSendBulkSMS} loading={sending} icon={<MessageSquare className="w-5 h-5" />} label={sending ? 'Initiating SMS...' : 'Send SMS Notification'} color="bg-amber-600" />
             </div>
          </ModalWrapper>
        )}
      </AnimatePresence>
    </div>
  );
};

// HELPER COMPONENTS
const ModalWrapper = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/60 backdrop-blur-md"
    />
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="relative bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl overflow-hidden"
    >
       <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all">
          <X className="w-6 h-6" />
       </button>
       {children}
    </motion.div>
  </div>
);

const InputGroup = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-3">
     <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</label>
     <input 
      type="text" value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-8 py-5 font-bold text-sm outline-none transition-all" 
      placeholder={placeholder} 
     />
  </div>
);

const TextAreaGroup = ({ label, value, onChange, placeholder, height = "h-40" }) => (
  <div className="space-y-3">
     <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</label>
     <textarea 
      value={value} onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600/10 focus:bg-white rounded-[1.5rem] px-8 py-5 font-medium text-sm ${height} outline-none transition-all resize-none`} 
      placeholder={placeholder} 
     />
  </div>
);

const ActionButton = ({ onClick, loading, icon, label, color = "bg-indigo-600" }) => (
  <button 
    onClick={onClick} disabled={loading}
    className={`w-full py-6 ${color} text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 flex items-center justify-center gap-4 hover:brightness-110 transition-all disabled:opacity-50`}
  >
     {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : icon}
     {label}
  </button>
);

export default AdminNotifications;
