import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  CartesianGrid
} from "recharts";
import { 
  Download, 
  History, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  CreditCard,
  Filter,
  Calendar,
  Search,
  ChevronDown
} from "lucide-react";
import { motion } from "framer-motion";
import OwnerSidebar from "../components/OwnerSidebar";
import OwnerHeader from "../components/OwnerHeader";
import toast from "react-hot-toast";
import { bookingService, authService } from "../../src/core/services/firebaseService";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helper for formatting large numbers
const formatCurrency = (value) => {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value;
};

export default function Earnings() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser() || JSON.parse(sessionStorage.getItem('currentUser')));

  useEffect(() => {
    const unsubscribeAuth = authService.onAuthStateChange((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (sessionUser) {
          setCurrentUser(sessionUser);
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const unsubscribe = bookingService.getOwnerBookings(currentUser.uid, (data) => {
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Derived Data for Charts
  const chartData = useMemo(() => {
    const monthlyData = monthNames.map(name => ({ name, value: 0 }));
    
    bookings.forEach(b => {
      const date = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      if (date.getFullYear().toString() === selectedYear) {
        const monthIdx = date.getMonth();
        const amount = Number(b.amount) || Number(b.price) || Number(b.propertyPrice) || 0;
        if (b.bookingStatus === 'confirmed' || b.paymentStatus === 'paid') {
          monthlyData[monthIdx].value += amount;
        }
      }
    });

    return monthlyData;
  }, [bookings, selectedYear]);

  const stats = useMemo(() => {
    const totalBalance = bookings
      .filter(b => b.bookingStatus === 'confirmed' || b.paymentStatus === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.amount) || Number(curr.price) || Number(curr.propertyPrice) || 0), 0);
    
    const pending = bookings
      .filter(b => b.bookingStatus === 'pending' && b.paymentStatus !== 'paid')
      .reduce((acc, curr) => acc + (Number(curr.amount) || Number(curr.price) || Number(curr.propertyPrice) || 0), 0);

    return {
      total: totalBalance,
      pending: pending,
      currentYearTotal: chartData.reduce((acc, curr) => acc + curr.value, 0)
    };
  }, [bookings, chartData]);

  const transactions = useMemo(() => {
    let filtered = bookings.map(b => ({
      id: b.id,
      shortId: b.id.substring(0, 8),
      date: b.createdAt?.toDate ? b.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      property: b.propertyTitle || b.propertyName || 'Property',
      amount: Number(b.amount) || Number(b.price) || Number(b.propertyPrice) || 0,
      status: (b.paymentStatus === 'paid' || b.bookingStatus === 'confirmed' || b.bookingStatus === 'completed') ? 'Completed' : 'Pending'
    }));

    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tx.property.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    return filtered.slice(0, 10);
  }, [bookings, searchTerm, statusFilter]);

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (parseFloat(withdrawAmount) > stats.total) {
      toast.error("Insufficient balance");
      return;
    }
    toast.success(`Withdraw request for ₹${withdrawAmount} sent successfully!`);
    setWithdrawAmount('');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <OwnerSidebar />
      <main className="flex-1 lg:ml-72 ml-0 min-h-screen bg-slate-50/50 transition-all duration-300 overflow-x-hidden">
        <OwnerHeader />
        
        <div className="p-4 md:p-10 space-y-8 max-w-full overflow-x-hidden">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Earnings & Wallet</h1>
              <p className="text-gray-500 text-[10px] font-medium mt-1 uppercase tracking-widest">Financial Performance</p>
            </div>
            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
              <div className="relative w-1/2 sm:w-auto">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 appearance-none font-bold text-xs shadow-sm"
                >
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <button className="w-1/2 sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl shadow-lg shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Report</span>
                <span className="sm:hidden">Report</span>
              </button>
            </div>
          </div>

          {/* TOP GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* WALLET CARD - Glassmorphism Dark Gradient */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-1 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 text-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                    <Wallet className="w-6 h-6 text-indigo-300" />
                  </div>
                  <CreditCard className="w-6 h-6 text-white/40" />
                </div>
                
                <h2 className="text-[9px] sm:text-[10px] font-black text-indigo-300/80 uppercase tracking-[0.2em]">Total Balance</h2>
                <h1 className="text-4xl sm:text-5xl font-black mt-2 tracking-tighter">₹{stats.total.toLocaleString()}</h1>
                
                <div className="flex justify-between mt-6 p-4 sm:p-6 bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/5">
                  <div>
                    <p className="text-[8px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Pending</p>
                    <p className="text-sm sm:text-lg font-black">₹{stats.pending.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] sm:text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Next Payout</p>
                    <p className="text-sm sm:text-lg font-black">{new Date().getDate() > 15 ? '30' : '15'} {monthNames[new Date().getMonth()]}</p>
                  </div>
                </div>

                {/* WITHDRAW SECTION */}
                <div className="mt-6 bg-white/10 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 backdrop-blur-md">
                  <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-2 block">Enter Amount to Withdraw</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 font-bold">₹</span>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-indigo-300/50 outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/20 transition-all font-bold"
                    />
                  </div>
                  <button
                    onClick={handleWithdraw}
                    className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-950/40"
                  >
                    Withdraw to Bank
                  </button>
                </div>
              </div>
            </motion.div>

            {/* BAR CHART - Monthly Growth */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Annual Earnings ({selectedYear})</h3>
                    <h2 className="text-3xl font-black text-gray-900 mt-1">₹{stats.currentYearTotal.toLocaleString()}</h2>
                  </div>
                  <div className="p-2.5 bg-green-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="h-[220px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Earnings']}
                      contentStyle={{ 
                        borderRadius: '1rem', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#6366F1" 
                      radius={[6, 6, 0, 0]} 
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* LINE CHART - Average Monthly */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Monthly Trends ({selectedYear})</h3>
                    <h2 className="text-3xl font-black text-gray-900 mt-1">₹{(stats.currentYearTotal / (chartData.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-xl">
                    <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </div>
              <div className="h-[220px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip 
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{ 
                        borderRadius: '1rem', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontWeight: 'bold'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8B5CF6" 
                      strokeWidth={4} 
                      dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* TRANSACTION TABLE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">Transaction History</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Recent payouts and earnings</p>
                </div>
              </div>

              {/* UNIFIED FILTERS */}
              <div className="flex flex-row gap-2 w-full lg:w-auto">
                <div className="relative w-1/2 lg:w-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <div className="relative w-1/2 lg:w-auto">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction ID</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <span className="text-xs font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">{tx.shortId}</span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-sm font-bold text-gray-600">{tx.date}</span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-sm font-black text-gray-900 tracking-tight">{tx.property}</span>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-sm font-black text-emerald-600">₹{tx.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                          tx.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
