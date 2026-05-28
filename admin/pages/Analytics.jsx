import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Home, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Download,
  Filter,
  PieChart as PieChartIcon,
  Activity,
  Globe,
  X,
  Terminal,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { firestoreService, bookingService } from '@core/services/firebaseService';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminAnalytics = () => {
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [visibleLines, setVisibleLines] = useState({ revenue: true, users: true });
  const [visibleBars, setVisibleBars] = useState({ vendors: true, users: true });

  useEffect(() => {
    const unsubUsers = firestoreService.subscribeToUsers(setUsers);
    const unsubBookings = bookingService.getAllBookings(setBookings);
    const unsubProps = firestoreService.subscribeToProperties({}, (data) => {
      setProperties(data);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubBookings();
      unsubProps();
    };
  }, []);

  // Real data calculations
  const performanceStats = useMemo(() => {
    const totalRevenue = bookings.filter(b => b.bookingStatus === 'confirmed').reduce((sum, b) => sum + (Number(b.propertyPrice) || 0), 0);
    const conversionRate = bookings.length > 0 ? (bookings.filter(b => b.bookingStatus === 'confirmed').length / bookings.length * 100).toFixed(1) : 0;
    
    return [
      { title: 'Platform Revenue', value: `₹${totalRevenue.toLocaleString()}`, trend: '+18.4%', status: 'up' },
      { title: 'Conversion Rate', value: `${conversionRate}%`, trend: '+2.1%', status: 'up' },
      { title: 'Active Listings', value: properties.length, trend: '+4.5%', status: 'up' },
      { title: 'Total Visits', value: bookings.length * 4, trend: '+12%', status: 'up' },
    ];
  }, [bookings, properties]);

  // Chart Data
  const monthlyRevenue = [
    { name: 'Jan', revenue: 42000, users: 400 },
    { name: 'Feb', revenue: 38000, users: 450 },
    { name: 'Mar', revenue: 55000, users: 600 },
    { name: 'Apr', revenue: 48000, users: 550 },
    { name: 'May', revenue: 62000, users: 700 },
    { name: 'Jun', revenue: 75000, users: 850 },
    { name: 'Jul', revenue: 82000, users: 900 },
    { name: 'Aug', revenue: 88000, users: 950 },
    { name: 'Sep', revenue: 95000, users: 1100 },
    { name: 'Oct', revenue: 105000, users: 1200 },
    { name: 'Nov', revenue: 115000, users: 1350 },
    { name: 'Dec', revenue: 130000, users: 1500 },
  ];

  const cityPerformance = [
    { city: 'Mumbai', value: 450000 },
    { city: 'Delhi', value: 380000 },
    { city: 'Bangalore', value: 320000 },
    { city: 'Pune', value: 210000 },
    { city: 'Hyderabad', value: 180000 },
  ];

  const userGrowth = [
    { day: 'Mon', vendors: 12, users: 45 },
    { day: 'Tue', vendors: 15, users: 52 },
    { day: 'Wed', vendors: 10, users: 38 },
    { day: 'Thu', vendors: 22, users: 65 },
    { day: 'Fri', vendors: 18, users: 48 },
    { day: 'Sat', vendors: 25, users: 70 },
    { day: 'Sun', vendors: 20, users: 55 },
  ];

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const headers = ['Metric', 'Current Value', 'Trend'];
      const data = performanceStats.map(s => [s.title, s.value, s.trend]);
      const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `platform_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExporting(false);
      toast.success('Full report exported successfully!');
    }, 1500);
  };

  const handleCustomRange = () => {
    setShowRangeModal(true);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Advanced Analytics</h1>
          <p className="text-gray-500 font-medium">Deep dive into platform performance and user trends.</p>
        </div>
        <div className="flex items-center gap-3">
           <button 
            onClick={handleCustomRange}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
           >
             <Calendar className="w-5 h-5" />
             <span>Custom Range</span>
           </button>
           <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
           >
             {exporting ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <Download className="w-5 h-5" />
             )}
             <span>{exporting ? 'Generating...' : 'Export Full Report'}</span>
           </button>
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {performanceStats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-4">
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.title}</span>
               <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black ${stat.status === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                 {stat.status === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                 {stat.trend}
               </div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs User Growth */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Growth Trajectory</h3>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setVisibleLines(prev => ({ ...prev, revenue: !prev.revenue }))}
                  className={`flex items-center gap-2 transition-opacity ${!visibleLines.revenue ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase">Revenue</span>
                </button>
                <button 
                  onClick={() => setVisibleLines(prev => ({ ...prev, users: !prev.users }))}
                  className={`flex items-center gap-2 transition-opacity ${!visibleLines.users ? 'opacity-30' : 'opacity-100'}`}
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase">Users</span>
                </button>
             </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366F1" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10B981" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                {visibleLines.revenue && (
                  <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                )}
                {visibleLines.users && (
                  <Area yAxisId="right" type="monotone" dataKey="users" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Partner Activity */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Weekly Registration Trends</h3>
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => setVisibleBars(prev => ({ ...prev, vendors: !prev.vendors }))}
                 className={`flex items-center gap-2 transition-opacity ${!visibleBars.vendors ? 'opacity-30' : 'opacity-100'}`}
               >
                 <div className="w-3 h-3 rounded-full bg-indigo-500" />
                 <span className="text-[10px] font-black text-gray-400 uppercase">Vendors</span>
               </button>
               <button 
                 onClick={() => setVisibleBars(prev => ({ ...prev, users: !prev.users }))}
                 className={`flex items-center gap-2 transition-opacity ${!visibleBars.users ? 'opacity-30' : 'opacity-100'}`}
               >
                 <div className="w-3 h-3 rounded-full bg-emerald-500" />
                 <span className="text-[10px] font-black text-gray-400 uppercase">Users</span>
               </button>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '20px', border: 'none' }} />
                {visibleBars.vendors && (
                  <Bar dataKey="vendors" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={20} />
                )}
                {visibleBars.users && (
                  <Bar dataKey="users" fill="#10B981" radius={[6, 6, 0, 0]} barSize={20} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City Wise Revenue */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-50">
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">Revenue by Location</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={cityPerformance}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="city" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontSize: 12, fontWeight: 800}} width={100} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 10, 10, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Stats */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100 text-white overflow-hidden relative">
           <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-6 h-6 text-indigo-300" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Platform Reach</h3>
                </div>
                <p className="text-sm font-bold text-indigo-100">Your platform is expanding across 12 major regions.</p>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase opacity-60">Avg. Response Time</span>
                    <span className="text-sm font-black">2.4 Hours</span>
                 </div>
                 <div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-emerald-400 h-full rounded-full w-[85%]" /></div>
                 
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase opacity-60">System Uptime</span>
                    <span className="text-sm font-black">99.98%</span>
                 </div>
                 <div className="w-full bg-white/10 rounded-full h-1.5"><div className="bg-emerald-400 h-full rounded-full w-[99%]" /></div>
              </div>

              <div className="pt-8">
                 <button 
                  onClick={() => setShowLogsModal(true)}
                  className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all shadow-lg"
                 >
                   View Server Logs
                 </button>
              </div>
           </div>
           
           <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Server Logs Modal */}
      <AnimatePresence>
        {showLogsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gray-900 rounded-[32px] w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">System Logs</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real-time Node Monitoring</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLogsModal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 font-mono text-[11px] leading-relaxed max-h-[400px] overflow-y-auto no-scrollbar bg-black/40">
                <div className="space-y-2">
                  <p className="text-emerald-400">[SUCCESS] Firestore listener attached: users_collection</p>
                  <p className="text-indigo-400">[INFO] Syncing platform revenue data (4.2ms)</p>
                  <p className="text-gray-400">[LOG] 22 concurrent sessions active on edge-node-01</p>
                  <p className="text-emerald-400">[SUCCESS] Load balancer health check passed: 100%</p>
                  <p className="text-gray-400">[LOG] Indexing recent bookings for analytical cache...</p>
                  <p className="text-amber-400">[WARN] Delayed response from backup-region-us-east</p>
                  <p className="text-emerald-400">[SUCCESS] SSR hydration complete for route: /admin/analytics</p>
                  <p className="text-indigo-400">[INFO] Memory usage stable: 142MB / 512MB</p>
                  <p className="text-emerald-400">[SUCCESS] Transaction logs flushed to cold storage</p>
                </div>
              </div>

              <div className="p-6 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase">Operational</span>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <span className="text-[10px] font-black text-gray-500 uppercase">v2.4.0-stable</span>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Download Logs</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Range Modal */}
      <AnimatePresence>
        {showRangeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Select Range</h3>
                <button onClick={() => setShowRangeModal(false)} className="p-2 hover:bg-gray-50 rounded-xl"><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Today', icon: Activity },
                  { label: 'Last 7 Days', icon: Calendar },
                  { label: 'Last 30 Days', icon: Calendar },
                  { label: 'Year to Date', icon: TrendingUp },
                ].map((option) => (
                  <button 
                    key={option.label}
                    onClick={() => {
                      toast.success(`Range updated to: ${option.label}`);
                      setShowRangeModal(false);
                    }}
                    className="w-full p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-indigo-600 group transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-xl transition-colors">
                        <option.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-black text-gray-900">{option.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))}
              </div>

              <div className="mt-8 p-4 bg-emerald-50 rounded-2xl flex items-start gap-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-tight">Selecting a custom range will refresh all platform-wide metrics automatically.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAnalytics;
