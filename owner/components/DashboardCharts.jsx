import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { TrendingUp, IndianRupee, CreditCard, CalendarCheck, TrendingDown } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 shadow-2xl rounded-2xl border border-slate-100 flex flex-col gap-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p className="text-lg font-black text-[#4F46E5]">
          {payload[0].name === 'revenue' ? `₹${payload[0].value.toLocaleString()}` : `${payload[0].value} Inquiries`}
        </p>
      </div>
    );
  }
  return null;
};

export function RevenueOverview({ data, kpiData }) {
  // Use real data if provided, otherwise empty fallbacks
  const kpis = [
    { label: 'Total Revenue', value: kpiData?.totalRevenue || '₹0', change: '+18.5%', icon: IndianRupee, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Avg Per Booking', value: kpiData?.avgPerLead || '₹0', change: '+12.3%', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Deals', value: kpiData?.pendingDeals || '0', change: 'Live Now', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Bookings', value: kpiData?.totalInquiries || '0', change: '+8.4%', icon: CalendarCheck, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-sm p-3 sm:p-5 lg:p-8 border border-gray-100 flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="text-base lg:text-lg font-black text-gray-900 uppercase tracking-tight leading-tight">Revenue Analytics</h3>
        </div>
        <div className="px-3 py-1.5 lg:px-4 lg:py-2 bg-gray-50 border border-gray-200 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <CalendarCheck className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          Real-Time Data
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="p-4 lg:p-5 rounded-2xl border border-gray-50 bg-gray-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2 lg:mb-3">
                <span className="text-[8px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest truncate mr-1">{kpi.label}</span>
                <div className={`p-1.5 lg:p-2 ${kpi.bg} ${kpi.color} rounded-lg lg:rounded-xl shrink-0`}>
                  <kpi.icon className="w-3 h-3 lg:w-4 lg:h-4" />
                </div>
              </div>
              <p className="text-lg lg:text-xl font-black text-gray-900 tracking-tighter truncate">{kpi.value}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 lg:mt-2">
              <span className={`text-[9px] lg:text-[10px] font-bold ${kpi.color}`}>{kpi.change}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="h-[320px] w-full px-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              tickFormatter={(v) => `₹${v/1000}K`}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: '#4F46E5', strokeWidth: 1.5, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#4F46E5" 
              strokeWidth={4}
              fill="url(#colorRevenue)" 
              dot={{ r: 4, fill: '#fff', stroke: '#4F46E5', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 lg:p-8 bg-[#0F172A] rounded-[1.5rem] lg:rounded-[2.5rem] shadow-2xl shadow-slate-200/50 gap-4 sm:gap-6 border border-white/5">
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-500/20 rounded-xl lg:rounded-2xl flex items-center justify-center border border-indigo-500/30">
              <IndianRupee className="w-5 h-5 lg:w-6 lg:h-6 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <p className="text-[8px] lg:text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5 lg:mb-1">Live Revenue</p>
              <p className="text-xl lg:text-3xl font-black text-white tracking-tighter">{kpiData?.totalRevenue || '₹0'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3 px-4 py-2 lg:px-6 lg:py-3 bg-white/5 hover:bg-white/10 transition-colors text-white rounded-xl lg:rounded-2xl text-[9px] lg:text-[11px] font-black uppercase tracking-[0.15em] border border-white/10 group cursor-pointer w-full sm:w-auto justify-center sm:justify-start">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          Real-Time Sync
        </div>
      </div>
    </div>
  );
}

export function BookingOverview({ data, totalCount }) {
  return (
    <div className="bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-sm p-5 lg:p-8 border border-gray-100">
      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Activity Stream</h3>
        </div>
        <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">
          Weekly View
        </div>
      </div>

      <div className="mb-10">
        <p className="text-5xl font-black text-gray-900 tracking-tighter leading-none">{totalCount || 0}</p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3">Total Inquiries Received</p>
      </div>
      
      <div className="h-[200px] w-full px-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
            <Bar 
              dataKey="bookings" 
              fill="#4F46E5" 
              radius={[4, 4, 4, 4]} 
              barSize={16}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
