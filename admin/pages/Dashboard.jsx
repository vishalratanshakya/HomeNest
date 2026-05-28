import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Home, 
  MapPin, 
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Plus,
  MoreVertical,
  Tag,
  Key,
  ChevronDown
} from 'lucide-react';
import { firestoreService, bookingService } from '@core/services/firebaseService';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ComposedChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarPicker from '../../vendor/components/CalendarPicker';
const REVENUE_DATA_HUB = {
  "2025": [
    { name: 'Jan', revenue: 65000, uploads: 12, growth: '+12%' },
    { name: 'Feb', revenue: 72000, uploads: 15, growth: '+10%' },
    { name: 'Mar', revenue: 68000, uploads: 8, growth: '-5%' },
    { name: 'Apr', revenue: 84000, uploads: 18, growth: '+23%' },
    { name: 'May', revenue: 95000, uploads: 22, growth: '+13%' },
    { name: 'Jun', revenue: 88000, uploads: 14, growth: '-7%' },
    { name: 'Jul', revenue: 102000, uploads: 25, growth: '+16%' },
    { name: 'Aug', revenue: 115000, uploads: 28, growth: '+12%' },
    { name: 'Sep', revenue: 108000, uploads: 19, growth: '-6%' },
    { name: 'Oct', revenue: 125000, uploads: 32, growth: '+15%' },
    { name: 'Nov', revenue: 132000, uploads: 35, growth: '+5%' },
    { name: 'Dec', revenue: 145000, uploads: 42, growth: '+10%' },
  ],
  "2024": [
    { name: 'Jan', revenue: 42000, uploads: 8, growth: '+4%' },
    { name: 'Feb', revenue: 45000, uploads: 9, growth: '+7%' },
    { name: 'Mar', revenue: 51000, uploads: 12, growth: '+13%' },
    { name: 'Apr', revenue: 48000, uploads: 7, growth: '-6%' },
    { name: 'May', revenue: 55000, uploads: 14, growth: '+14%' },
    { name: 'Jun', revenue: 59000, uploads: 15, growth: '+7%' },
    { name: 'Jul', revenue: 62000, uploads: 16, growth: '+5%' },
    { name: 'Aug', revenue: 68000, uploads: 18, growth: '+10%' },
    { name: 'Sep', revenue: 65000, uploads: 14, growth: '-4%' },
    { name: 'Oct', revenue: 72000, uploads: 19, growth: '+11%' },
    { name: 'Nov', revenue: 78000, uploads: 21, growth: '+8%' },
    { name: 'Dec', revenue: 85000, uploads: 25, growth: '+9%' },
  ],
  "2023": [
    { name: 'Jan', revenue: 30000, growth: '+2%' },
    { name: 'Feb', revenue: 32000, growth: '+6%' },
    { name: 'Mar', revenue: 35000, growth: '+9%' },
    { name: 'Apr', revenue: 33000, growth: '-5%' },
    { name: 'May', revenue: 38000, growth: '+15%' },
    { name: 'Jun', revenue: 41000, growth: '+8%' },
    { name: 'Jul', revenue: 44000, growth: '+7%' },
    { name: 'Aug', revenue: 49000, growth: '+11%' },
    { name: 'Sep', revenue: 46000, growth: '-6%' },
    { name: 'Oct', revenue: 52000, growth: '+13%' },
    { name: 'Nov', revenue: 56000, growth: '+7%' },
    { name: 'Dec', revenue: 60000, growth: '+7%' },
  ]
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl px-6 py-4 border border-gray-100 flex flex-col gap-2 min-w-[180px]">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <div className="space-y-1">
           <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Revenue</span>
              <span className="text-sm font-black text-gray-900">₹{payload[0].value.toLocaleString()}</span>
           </div>
           {payload[1] && (
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Uploads</span>
                <span className="text-sm font-black text-indigo-600">{payload[1].value} Properties</span>
             </div>
           )}
        </div>
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-50">
           <div className={`w-1.5 h-1.5 rounded-full ${payload[0].payload.growth.startsWith('+') ? 'bg-emerald-500' : 'bg-rose-500'}`} />
           <span className={`text-[9px] font-black uppercase ${payload[0].payload.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {payload[0].payload.growth} Growth
           </span>
        </div>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2025');
  const [period, setPeriod] = useState('This Year');
  const [showCalendar, setShowCalendar] = useState(false);

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

  const stats = useMemo(() => {
    const totalRev = bookings.filter(b => b.bookingStatus === 'confirmed').reduce((s, b) => s + (Number(b.propertyPrice) || 0), 0);
    const vendors = users.filter(u => u.role === 'vendor' || u.role === 'agent').length;
    const activeUsers = users.filter(u => u.role === 'user').length;
    const sellProps = properties.filter(p => p.type === 'sell').length;
    const rentProps = properties.filter(p => p.type === 'rent').length;
    
    return [
      { title: 'Total Revenue', value: `₹${totalRev.toLocaleString()}`, trend: '+12.5%', icon: DollarSign, color: 'text-white', bg: 'bg-emerald-500', shadow: 'shadow-emerald-200', path: '/admin/payments' },
      { title: 'Total Vendors', value: vendors, trend: '+8.2%', icon: Users, color: 'text-white', bg: 'bg-indigo-500', shadow: 'shadow-indigo-200', path: '/admin/vendors' },
      { title: 'Total Users', value: activeUsers, trend: '+15.3%', icon: Users, color: 'text-white', bg: 'bg-blue-500', shadow: 'shadow-blue-200', path: '/admin/users' },
      { title: 'Total Properties', value: properties.length, trend: '+5.7%', icon: Home, color: 'text-white', bg: 'bg-orange-500', shadow: 'shadow-orange-200', path: '/admin/properties' },
      { title: 'Sell Properties', value: sellProps, trend: '+4.2%', icon: Tag, color: 'text-white', bg: 'bg-rose-500', shadow: 'shadow-rose-200', path: '/admin/sell-properties' },
      { title: 'Rent Properties', value: rentProps, trend: '+7.1%', icon: Key, color: 'text-white', bg: 'bg-violet-500', shadow: 'shadow-violet-200', path: '/admin/rent-properties' },
      { title: 'Pending Approvals', value: properties.filter(p => p.status === 'pending').length, trend: 'Action Needed', icon: Clock, color: 'text-white', bg: 'bg-amber-500', shadow: 'shadow-amber-200', path: '/admin/properties' },
      { title: 'Active Bookings', value: bookings.filter(b => b.bookingStatus === 'pending').length, trend: 'Live', icon: CalendarIcon, color: 'text-white', bg: 'bg-sky-500', shadow: 'shadow-sky-200', path: '/admin/reports' },
    ];
  }, [users, bookings, properties]);

  const chartData = useMemo(() => {
    const data = REVENUE_DATA_HUB[year] || REVENUE_DATA_HUB['2025'];
    if (period === '6 Months') return data.slice(0, 6);
    if (period === '30 Days') return data.slice(data.length - 1, data.length); // Placeholder
    if (period === '7 Days') return data.slice(data.length - 1, data.length); // Placeholder
    return data;
  }, [year, period]);

  const revenueTotal = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [chartData]);

  const revenueData = chartData; // Compatibility with bottom bar chart

  const propertyShare = [
    { name: 'Sell', value: properties.filter(p => p.type === 'sell').length || 1 },
    { name: 'Rent', value: properties.filter(p => p.type === 'rent').length || 1 },
  ];

  const COLORS = ['#6366F1', '#10B981'];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 pb-6 px-2 md:px-0">
      {/* Header - More Compact */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase leading-none">Admin Dashboard</h1>
          <p className="text-gray-400 text-xs md:text-sm font-medium mt-1">Real-time platform performance metrics.</p>
        </div>
      </div>

      {/* Analytics Cards - 2 Rows with Mobile Scroll */}
      <div className="space-y-6">
        {[stats.slice(0, 4), stats.slice(4, 8)].map((row, rowIdx) => (
          <div key={rowIdx} className="flex overflow-x-auto pb-4 lg:pb-0 lg:overflow-visible no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 scroll-smooth snap-x snap-mandatory">
            <div className="grid grid-flow-col lg:grid-cols-4 auto-cols-[calc(70%-12px)] sm:auto-cols-[calc(40%-12px)] lg:auto-cols-auto gap-4 min-w-full">
              {row.map((stat, idx) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (rowIdx * 4 + idx) * 0.1 }}
                  onClick={() => stat.path && navigate(stat.path)}
                  className={`${stat.bg} rounded-[28px] p-5 shadow-lg ${stat.shadow} transition-all group hover:-translate-y-1 snap-center cursor-pointer relative overflow-hidden lg:max-w-[280px] w-full mx-auto`}
                >
                  {/* Decorative Glow */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl group-hover:scale-110 transition-transform">
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-white bg-black/10 backdrop-blur-sm px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      {stat.trend}
                    </div>
                  </div>
                  <div className="relative z-10">
                    <p className="text-white/70 text-[9px] font-black uppercase tracking-[0.15em] mb-0.5">{stat.title}</p>
                    <h3 className="text-xl font-black text-white tracking-tight leading-none">{stat.value}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Premium Revenue Analytics Section */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-4 md:p-8 overflow-hidden relative"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">Revenue Analytics</h2>
            <p className="text-gray-400 text-xs md:text-sm font-medium">Performance tracking and growth forecasting.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            {/* Year Selector - 50% on Mobile */}
            <div className="relative w-1/2 sm:w-auto">
              <select 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full sm:w-32 appearance-none bg-white border-2 border-indigo-50 px-4 py-2.5 pr-10 rounded-xl text-[10px] font-black text-indigo-600 focus:outline-none focus:border-indigo-200 transition-all cursor-pointer uppercase tracking-widest shadow-sm"
              >
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </div>
            </div>

            {/* Period Selector - 50% on Mobile, now a Dropdown */}
            <div className="relative w-1/2 sm:w-auto">
              <select 
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full sm:w-40 appearance-none bg-indigo-50/30 border-2 border-transparent px-4 py-2.5 pr-10 rounded-xl text-[10px] font-black text-indigo-600 focus:outline-none focus:bg-white focus:border-indigo-200 transition-all cursor-pointer uppercase tracking-widest"
              >
                {['7 Days', '30 Days', '6 Months', 'This Year'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-3 h-3 text-indigo-400" />
              </div>
            </div>

            {/* Hidden on very small screens, visible from sm up */}
            <button className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100/50">
              <Plus className="w-3.5 h-3.5" />
              Report
            </button>
          </div>
        </div>

        {/* Top Analytics Cards (Internal) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-indigo-600 p-6 rounded-[28px] shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all group">
            <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:bg-white group-hover:text-indigo-600 transition-all">
                  <DollarSign className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Total Revenue</span>
            </div>
            <div className="flex items-end justify-between">
               <h4 className="text-2xl font-black text-white">₹{revenueTotal.toLocaleString()}</h4>
               <span className="text-xs font-black text-white/80 flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-4 h-4" /> +18.4%
               </span>
            </div>
          </div>
          
          <div className="bg-emerald-600 p-6 rounded-[28px] shadow-lg shadow-emerald-100 hover:scale-[1.02] transition-all group">
            <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:bg-white group-hover:text-emerald-600 transition-all">
                  <TrendingUp className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Avg. Monthly</span>
            </div>
            <div className="flex items-end justify-between">
               <h4 className="text-2xl font-black text-white">₹{Math.round(revenueTotal/12).toLocaleString()}</h4>
               <span className="text-xs font-black text-white/80 bg-white/10 px-2 py-1 rounded-full">Stable</span>
            </div>
          </div>

          <div className="bg-rose-600 p-6 rounded-[28px] shadow-lg shadow-rose-100 hover:scale-[1.02] transition-all group">
            <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-white/20 text-white rounded-2xl group-hover:bg-white group-hover:text-rose-600 transition-all">
                  <ShoppingBag className="w-6 h-6" />
               </div>
               <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest">Highest Month</span>
            </div>
            <div className="flex items-end justify-between">
               <h4 className="text-2xl font-black text-white">Dec 2025</h4>
               <span className="text-xs font-black text-white/80 bg-white/10 px-2 py-1 rounded-full">₹1.45L</span>
            </div>
          </div>
        </div>

        {/* The Premium Graph */}
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                {/* Shadow Filter */}
                <filter id="shadow" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                  <feOffset in="blur" dx="0" dy="4" result="offsetBlur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Arrow Marker - Fixed orientation */}
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="4"
                  markerHeight="4"
                  orient="auto"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                </marker>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis 
                dataKey="name" 
                axisLine={{ stroke: '#111827', strokeWidth: 2 }} 
                tickLine={false} 
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}} 
                dy={15}
                minTickGap={25} // Fix for mobile overlap
              />
              <YAxis 
                axisLine={{ stroke: '#111827', strokeWidth: 2 }} 
                tickLine={false} 
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}} 
                domain={[0, 160000]}
                ticks={[0, 40000, 80000, 120000, 160000]}
                tickFormatter={(val) => val === 0 ? '0' : val >= 100000 ? `${val/100000}L` : `${val/1000}k`}
                dx={-5}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '5 5' }}
              />
              <Area 
                type="linear" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorRevenue)"
                filter="url(#shadow)"
                markerEnd="url(#arrow)"
                animationDuration={1500}
                activeDot={{ 
                  r: 6, 
                  fill: '#10B981', 
                  stroke: '#fff', 
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Premium Inventory & Growth Analytics UI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Property Distribution Analytics */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col group"
        >
          <div className="mb-6">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Property Distribution</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Allocation & Portfolio Balance</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-6 mt-4">
            {/* Left Side: Circle (50%) */}
            <div className="relative w-full lg:w-1/2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <defs>
                     <linearGradient id="gradSell" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#818CF8" stopOpacity={0.8} />
                     </linearGradient>
                     <linearGradient id="gradRent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#34D399" stopOpacity={0.8} />
                     </linearGradient>
                  </defs>
                  <Pie
                    data={propertyShare}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    animationDuration={1500}
                    stroke="none"
                  >
                    <Cell fill="url(#gradSell)" />
                    <Cell fill="url(#gradRent)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-white rounded-full w-28 h-28 shadow-[0_15px_40px_rgba(0,0,0,0.06)] border border-gray-50 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Total</span>
                    <span className="text-3xl font-black text-gray-900 my-0.5">{properties.length || 128}</span>
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
                 </div>
              </div>
            </div>
  
            {/* Right Side: Stacked Boxes (50%) */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4">
               {/* For Sell Card */}
               <div className="bg-[#F8FAFC] border border-gray-100 p-4 rounded-[20px] hover:shadow-md transition-all group/stat relative overflow-hidden">
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover/stat:bg-indigo-600 group-hover/stat:text-white transition-all shadow-sm">
                           <Tag className="w-3.5 h-3.5" />
                        </div>
                        <div>
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">For Sell</span>
                           <h4 className="text-lg font-black text-gray-900 leading-none mt-0.5">{properties.filter(p => p.type === 'sell').length} Units</h4>
                        </div>
                     </div>
                     <div className="h-6 w-16">
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={chartData.slice(-5)}>
                              <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={false} />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
  
               {/* For Rent Card */}
               <div className="bg-[#F8FAFC] border border-gray-100 p-4 rounded-[20px] hover:shadow-md transition-all group/stat relative overflow-hidden">
                  <div className="flex items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover/stat:bg-emerald-600 group-hover/stat:text-white transition-all shadow-sm">
                           <Key className="w-3.5 h-3.5" />
                        </div>
                        <div>
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">For Rent</span>
                           <h4 className="text-lg font-black text-gray-900 leading-none mt-0.5">{properties.filter(p => p.type === 'rent').length} Units</h4>
                        </div>
                     </div>
                     <div className="h-6 w-16">
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={chartData.slice(-5)}>
                              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Growth & Revenue Trend Analytics */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Growth Trend</h3>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Revenue vs Property Uploads</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[9px] font-black text-gray-400 uppercase">Revenue</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-200" />
                  <span className="text-[9px] font-black text-gray-400 uppercase">Uploads</span>
               </div>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] -mx-4 lg:-mx-8">
            <ResponsiveContainer width="100%" height="100%">
               <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                     <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.05} />
                     </linearGradient>
                     {/* Re-using or defining shadow and arrow for this chart */}
                     <filter id="shadowGrowth" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
                        <feOffset in="blur" dx="0" dy="3" result="offsetBlur" />
                        <feComponentTransfer>
                           <feFuncA type="linear" slope="0.3" />
                        </feComponentTransfer>
                        <feMerge>
                           <feMergeNode />
                           <feMergeNode in="SourceGraphic" />
                        </feMerge>
                     </filter>
                     <marker
                        id="arrowGrowth"
                        viewBox="0 0 10 10"
                        refX="5"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                     >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
                     </marker>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={{ stroke: '#111827', strokeWidth: 1.5 }} 
                    tickLine={false} 
                    tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 800}} 
                    dy={10}
                    padding={{ left: 0, right: 0 }}
                  />
                  <YAxis 
                    axisLine={{ stroke: '#111827', strokeWidth: 1.5 }} 
                    tickLine={false}
                    tick={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar 
                    dataKey="uploads" 
                    barSize={20} 
                    fill="url(#barGrad)" 
                    radius={[6, 6, 0, 0]} 
                    animationDuration={1500}
                  />
                  <Area 
                    type="linear" 
                    dataKey="revenue" 
                    stroke="#10B981" 
                    strokeWidth={3} 
                    fill="none"
                    filter="url(#shadowGrowth)"
                    markerEnd="url(#arrowGrowth)"
                    animationDuration={2000}
                    activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                  />
               </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Vendors</span>
                   <span className="text-lg font-black text-gray-900">{users.filter(u => u.role === 'vendor').length || 24}</span>
                </div>
                <div className="h-8 w-px bg-gray-100" />
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Platform Fee</span>
                   <span className="text-lg font-black text-gray-900">12.5%</span>
                </div>
             </div>
             <button 
                onClick={() => toast.success('Exporting analytical data...')}
                className="px-6 py-2.5 bg-gray-50 text-[10px] font-black text-gray-600 uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all"
             >
                Export Data
             </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: Recent Bookings & Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <div className="xl:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Activity</h3>
            <button 
              onClick={() => navigate('/admin/reports')}
              className="text-indigo-600 font-bold text-sm hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-6">
            {bookings.slice(0, 5).map((booking, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-sm tracking-tight">{booking.userName || 'Unknown User'}</h4>
                    <p className="text-xs text-gray-500 font-bold">{booking.propertyName} • {booking.createdAt?.toDate ? booking.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    booking.bookingStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                    booking.bookingStatus === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {booking.bookingStatus}
                  </span>
                  <button className="p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Widget Placeholder */}
        <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-100 text-white flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight">Schedule</h3>
              <button onClick={() => setShowCalendar(true)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <CalendarIcon className="w-6 h-6 opacity-60" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-xs font-black opacity-60 uppercase">May</p>
                  <p className="text-2xl font-black">12</p>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <p className="text-xs font-black uppercase tracking-widest mb-1 opacity-80">Upcoming Visit</p>
                  <p className="text-sm font-bold">Luxury Villa Inspection</p>
                  <div className="flex items-center gap-2 mt-2 opacity-60">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">10:30 AM</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-xs font-black opacity-60 uppercase">May</p>
                  <p className="text-2xl font-black">15</p>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 opacity-60">
                  <p className="text-xs font-black uppercase tracking-widest mb-1">Meeting</p>
                  <p className="text-sm font-bold">New Vendor Onboarding</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">02:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowCalendar(true)}
            className="relative z-10 w-full mt-8 bg-white text-indigo-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-colors shadow-lg"
          >
            Manage Calendar
          </button>

          {/* Decorative shapes */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl" />
        </div>
      </div>
      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
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
            >
              <CalendarPicker 
                onApply={(range) => {
                  console.log("Selected range:", range);
                  setShowCalendar(false);
                }}
                onCancel={() => setShowCalendar(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
