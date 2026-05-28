import { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  MoreVertical, 
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
   IndianRupee,
  RefreshCcw,
  ChevronDown
} from 'lucide-react';
import { bookingService } from '@core/services/firebaseService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    // We use bookings as transaction records for now
    const unsubscribe = bookingService.getAllBookings((data) => {
      setTransactions(data.filter(b => b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const totalRevenue = transactions.reduce((acc, t) => acc + (Number(t.propertyPrice || t.totalAmount) || 0), 0);
  const platformBalance = totalRevenue * 0.1;
  const revenueGoal = 2000000; // ₹2M Goal
  const progressPercent = Math.min((totalRevenue / revenueGoal) * 100, 100);

  const revenueStats = [
    { title: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, trend: '+22.5%', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Pending Payouts', value: '₹42,500', trend: '-5.2%', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Platform Fee', value: `₹${platformBalance.toLocaleString()}`, trend: '+15.3%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Refunds Issued', value: '₹12,400', trend: '+1.2%', icon: RefreshCcw, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const currentDay = new Date().getDay();
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      const dayTotal = transactions.filter(t => {
        const tDate = t.createdAt?.toDate ? t.createdAt.toDate() : new Date();
        return tDate.toDateString() === date.toDateString();
      }).reduce((acc, t) => acc + (Number(t.propertyPrice || t.totalAmount) || 0), 0);
      
      last7Days.push({ name: dayName, amount: dayTotal });
    }
    return last7Days;
  }, [transactions]);

  const handleWithdraw = () => {
    setWithdrawing(true);
    setTimeout(() => {
      setWithdrawing(false);
      setShowWithdrawalModal(false);
      toast.success(`Withdrawal of ₹${platformBalance.toLocaleString()} initiated successfully!`);
    }, 2000);
  };

  const handleExport = () => {
    if (transactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }

    const headers = ['Transaction ID', 'Customer', 'Property', 'Date', 'Amount', 'Status'];
    const csvRows = [headers.join(',')];

    transactions.forEach(t => {
      const row = [
        `"${t.id || 'N/A'}"`,
        `"${t.userName || 'Customer'}"`,
        `"${t.propertyName || 'N/A'}"`,
        `"${t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'N/A'}"`,
        `"${t.propertyPrice || t.totalAmount || 0}"`,
        `"${t.paymentStatus || 'confirmed'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Financial_Export_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial report exported successfully!');
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Payments & Wallet</h1>
          <p className="text-gray-500 font-medium">Monitor financial health and manage transaction flows.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Download className="w-5 h-5" />
          <span>Financial Export</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueStats.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm"
          >
             <div className="flex justify-between items-start mb-4">
                <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl`}>
                   <stat.icon className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded-lg text-[9px] font-black ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                   {stat.trend}
                </div>
             </div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.title}</p>
             <h3 className="text-2xl font-black text-gray-900 tracking-tighter">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Growth Trajectory Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] xl:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left Column: Analytics Graph */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-4 sm:p-5 lg:p-7 flex flex-col h-full"
        >
          {/* Graph Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 uppercase tracking-tighter">Growth Trajectory</h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">Detailed revenue performance over time</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Scrollable Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 w-full sm:w-auto flex-nowrap whitespace-nowrap">
                {['All Time', '1 Month', '6 Months', '1 Year'].map((range) => (
                  <button 
                    key={range}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      range === '1 Month' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              
              {/* Year Dropdown */}
              <div className="relative w-full sm:w-auto">
                <select className="appearance-none w-full sm:w-auto bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 pr-10 text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none hover:bg-gray-100 transition-all cursor-pointer">
                  <option>2026</option>
                  <option>2025</option>
                  <option>2024</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="flex-1 min-h-[280px] sm:min-h-[340px] lg:min-h-[380px] xl:min-h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px' 
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366F1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#growthGradient)" 
                  activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Right Column: Calendar & Stats */}
        <div className="flex flex-col gap-6">
          {/* Calendar Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Performance Log
              </h3>
              <div className="flex gap-2">
                <button className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-gray-400" /></button>
              </div>
            </div>

            {/* Custom Compact Calendar */}
            <div className="space-y-4">
              <div className="grid grid-cols-7 text-center">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                  <span key={d} className="text-[10px] font-black text-gray-300 uppercase">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const isToday = day === new Date().getDate();
                  const hasEvent = [5, 12, 18, 25].includes(day);
                  return (
                    <div 
                      key={i} 
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all relative cursor-pointer
                        ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-600 hover:bg-gray-50'}
                      `}
                    >
                      {day}
                      {hasEvent && !isToday && <div className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 hover:border-indigo-100 transition-all group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Success Rate</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h4 className="text-2xl font-black text-gray-900 tracking-tighter">98.4%</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Transaction Stability</p>
                </div>
                <div className="w-16 h-8 flex items-end gap-0.5">
                  {[40, 60, 45, 80, 50, 90].map((h, i) => (
                    <div key={i} className="flex-1 bg-indigo-50 rounded-t-sm group-hover:bg-indigo-100 transition-colors" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 hover:border-indigo-100 transition-all group">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avg Session</span>
                <Clock className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <h4 className="text-2xl font-black text-gray-900 tracking-tighter">14.2m</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">User Engagement</p>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-indigo-50 border-t-indigo-500 -rotate-45" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-50 overflow-hidden">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Transactions</h3>
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                  type="text" 
                  placeholder="ID, User or Property..."
                  className="bg-gray-50 border-none rounded-xl pl-10 pr-4 py-2 text-xs font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500/20"
                 />
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transactions.slice(0, 10).map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                         <IndianRupee className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-xs font-black text-gray-900">{t.userName || 'Customer'}</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.propertyName} • {t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-gray-900">₹{Number(t.propertyPrice || t.totalAmount || 0).toLocaleString()}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${t.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                         {t.paymentStatus || 'confirmed'}
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </div>

      {/* Withdrawal Portal Modal */}
      <AnimatePresence>
        {showWithdrawalModal && (
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
              className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Withdrawal Portal</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Funds Management</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Available Balance</span>
                    <h4 className="text-3xl font-black text-gray-900 tracking-tight">₹{platformBalance.toLocaleString()}</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-gray-500">Processing Fee (2.5%)</span>
                      <span className="text-gray-900">₹{(platformBalance * 0.025).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold border-t border-gray-100 pt-4">
                      <span className="text-gray-900">Final Settlement</span>
                      <span className="text-indigo-600 font-black">₹{(platformBalance * 0.975).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowWithdrawalModal(false)}
                      className="py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={withdrawing || platformBalance <= 0}
                      className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {withdrawing ? (
                        <>
                          <RefreshCcw className="w-3 h-3 animate-spin" />
                          Processing...
                        </>
                      ) : 'Confirm Withdrawal'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPayments;
