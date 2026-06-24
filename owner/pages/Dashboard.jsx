import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  CalendarCheck, 
  Wallet, 
  Clock,
  LayoutGrid
} from 'lucide-react';
import OwnerSidebar from '../components/OwnerSidebar';
import OwnerHeader from '../components/OwnerHeader';
import StatCard from '../components/StatCard';
import { RevenueOverview, BookingOverview } from '../components/DashboardCharts';
import RecentBookingsTable from '../components/RecentBookingsTable';
import { QuickActions, RecentProperties } from '../components/DashboardPanels';
import { firestoreService, bookingService, authService } from '../../src/core/services/firebaseService';

export default function OwnerDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let unsubscribeProperties;
    let unsubscribeBookings;

    const unsubscribeAuth = authService.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      // Subscribe to Properties
      unsubscribeProperties = firestoreService.subscribeToProperties(
        {},
        (data) => {
          const filtered = data.filter(
            (p) => p.ownerId === currentUser.uid
          );
          setProperties(filtered);
        }
      );

      // Subscribe to Bookings
      unsubscribeBookings = bookingService.getOwnerBookings(
        currentUser.uid,
        (data) => {
          setBookings(data);
          setIsLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProperties) unsubscribeProperties();
      if (unsubscribeBookings) unsubscribeBookings();
    };
  }, [user]);

  // Derived Stats & KPIs
  const stats = useMemo(() => {
    const confirmedBookings = bookings.filter(b => 
      b.bookingStatus?.toLowerCase() === 'confirmed' || 
      b.paymentStatus?.toLowerCase() === 'paid'
    );

    const totalRevenueValue = confirmedBookings.reduce((acc, curr) => acc + (Number(curr.propertyPrice) || Number(curr.amount) || 0), 0);
    
    const pendingRequests = bookings.filter(b => 
      b.bookingStatus?.toLowerCase() === 'pending' || 
      b.status?.toLowerCase() === 'new lead'
    ).length;

    const formatRevenue = (val) => {
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
      if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
      return `₹${val}`;
    };

    return {
      properties: properties.length.toString(),
      bookings: bookings.length.toString(),
      revenue: formatRevenue(totalRevenueValue),
      revenueRaw: totalRevenueValue,
      pending: pendingRequests.toString(),
      avgPerLead: confirmedBookings.length > 0 ? formatRevenue(totalRevenueValue / confirmedBookings.length) : '₹0'
    };
  }, [properties, bookings]);

  // Chart Data Preparation (Group by Date)
  const revenueChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { 
          full: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          short: days[d.getDay()],
          dateObj: d
      };
    }).reverse();

    return last7Days.map(item => {
      const dayRevenue = bookings
        .filter(b => {
          const date = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return date.toLocaleDateString() === item.dateObj.toLocaleDateString() &&
                 (b.bookingStatus?.toLowerCase() === 'confirmed' || b.paymentStatus?.toLowerCase() === 'paid');
        })
        .reduce((acc, curr) => acc + (Number(curr.propertyPrice) || Number(curr.amount) || 0), 0);
      return { day: item.short, revenue: dayRevenue };
    });
  }, [bookings]);

  const bookingChartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { 
          full: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          short: days[d.getDay()],
          dateObj: d
      };
    }).reverse();

    return last7Days.map(item => {
      const dayCount = bookings.filter(b => {
        const date = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return date.toLocaleDateString() === item.dateObj.toLocaleDateString();
      }).length;
      return { day: item.short, bookings: dayCount };
    });
  }, [bookings]);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans">
      <OwnerSidebar />
      
      <main className="flex-1 w-full lg:ml-72 ml-0 flex flex-col h-screen overflow-y-auto transition-all duration-300 custom-scrollbar">
        <OwnerHeader />
        
        <div className="p-2 sm:p-5 lg:p-10 space-y-6 md:space-y-10 w-full">
          {/* Stat Cards Grid - 2 columns on mobile for "windows" look */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-8">
            <div onClick={() => navigate('/owner/properties')} className="cursor-pointer">
              <StatCard title="Total Listings" value={stats.properties} growth={0} icon={Building2} color={{ gradient: 'from-blue-600 to-indigo-600' }} isLoading={isLoading} />
            </div>
            <div onClick={() => navigate('/owner/bookings')} className="cursor-pointer">
              <StatCard title="Live Bookings" value={stats.bookings} growth={0} icon={CalendarCheck} color={{ gradient: 'from-emerald-500 to-teal-600' }} isLoading={isLoading} />
            </div>
            <div onClick={() => navigate('/owner/earnings')} className="cursor-pointer">
              <StatCard title="Total Value" value={stats.revenue} growth={0} icon={Wallet} color={{ gradient: 'from-orange-400 to-rose-500' }} isLoading={isLoading} />
            </div>
            <div onClick={() => navigate('/owner/bookings')} className="cursor-pointer">
              <StatCard title="Unresolved" value={stats.pending} growth={0} icon={Clock} color={{ gradient: 'from-indigo-500 to-purple-600' }} isLoading={isLoading} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <RevenueOverview 
                data={revenueChartData} 
                kpiData={{
                    totalRevenue: stats.revenue,
                    avgPerLead: stats.avgPerLead,
                    pendingDeals: stats.pending,
                    totalInquiries: stats.bookings
                }}
              />
              <RecentBookingsTable 
                bookings={bookings.slice(0, 5).map(b => ({
                  id: b.id.substring(0, 8),
                  customer: b.userName || b.customerName || 'Guest User',
                  avatar: b.userPhoto || `https://ui-avatars.com/api/?name=${b.userName || 'G'}&background=random&color=fff`,
                  propertyName: b.propertyName || b.propertyTitle || 'Property',
                  propertyImage: b.propertyImage || b.mainImage || b.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200',
                  dates: b.bookingDate || b.visitSchedule?.date || 'Inquiry',
                  amount: Number(b.propertyPrice) || Number(b.amount) || 0,
                  status: b.bookingStatus || b.status || 'Pending',
                  paymentStatus: b.paymentStatus || 'Pending'
                }))} 
                isLoading={isLoading} 
              />
            </div>

            <div className="space-y-8">
              <BookingOverview data={bookingChartData} totalCount={bookings.length} />
              <QuickActions isLoading={isLoading} />
              <RecentProperties 
                properties={properties.slice(0, 3).map(p => ({
                  name: p.title || p.name,
                  location: typeof p.location === 'object' ? p.location.city : (p.city || p.location || 'Location'),
                  price: Number(p.price) || 0,
                  status: p.status || 'Available',
                  image: p.mainImage || p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'
                }))} 
                isLoading={isLoading} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
