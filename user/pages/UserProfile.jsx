import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "./userDashboard.css";
import { authService, bookingService, firestoreService } from "@core/services/firebaseService";
import { Heart, Calendar, MapPin, MessageSquare, Building2 } from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState({
    saved: 0,
    bookings: 0,
    visits: 0,
    messages: 0
  });
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    let unsubscribeBookings = () => {};
    let unsubscribeConvos = () => {};
    let unsubscribeUserDoc = () => {};

    // Use onAuthStateChange instead of getCurrentUser() to handle async Firebase init
    const unsubscribeAuth = authService.onAuthStateChange(async (currentUser) => {
      setAuthLoading(false);
      if (!currentUser) {
        setUser(null);
        return;
      }

      // Fetch wishlist count
      try {
        const wishlist = await firestoreService.getUserWishlist(currentUser.uid);
        setStats(prev => ({
          ...prev,
          saved: wishlist ? wishlist.length : 0
        }));
      } catch (err) {
        console.error("Error fetching wishlist count:", err);
      }

      // Real-time bookings
      try {
        unsubscribeBookings = bookingService.getUserBookings(currentUser.uid, (data) => {
          setRecentBookings((data || []).slice(0, 1));
          setStats(prev => ({
            ...prev,
            bookings: (data || []).length,
            visits: (data || []).length
          }));
        });
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }

      // Real-time conversations count
      try {
        const unsub = firestoreService.subscribeToUserConversations(currentUser.uid, (convos) => {
          setStats(prev => ({
            ...prev,
            messages: (convos || []).length
          }));
        });
        if (typeof unsub === 'function') {
          unsubscribeConvos = unsub;
        }
      } catch (err) {
        console.error("Error subscribing to conversations:", err);
      }

      // Real-time user document from Firestore
      try {
        const unsubUser = firestoreService.subscribeToUserDocument(currentUser.uid, (userDoc) => {
          setUser({
            ...currentUser,
            displayName: userDoc?.fullName || userDoc?.displayName || userDoc?.name || currentUser.displayName,
            email: userDoc?.email || currentUser.email,
            phoneNumber: userDoc?.phone || userDoc?.phoneNumber || currentUser.phoneNumber || '',
            location: userDoc?.location || '',
            accountType: userDoc?.role === 'vendor' ? 'Property Vendor' : userDoc?.accountType || 'Property Buyer',
            memberSince: userDoc?.memberSince || (
              currentUser.metadata?.creationTime
                ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                : 'Recently Joined'
            )
          });
        });
        if (typeof unsubUser === 'function') {
          unsubscribeUserDoc = unsubUser;
        }
      } catch (err) {
        console.error("Error subscribing to user document:", err);
        setUser(currentUser);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBookings();
      unsubscribeConvos();
      unsubscribeUserDoc();
    };
  }, []);

  // Loading skeleton
  if (authLoading) {
    return (
      <>
        <div className="dashboard-stats">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stats-card blue animate-pulse opacity-40" />
          ))}
        </div>
        <div className="dashboard-card animate-pulse">
          <div className="h-8 bg-slate-100 rounded-xl w-1/3 mb-4" />
          <div className="info-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="info-box">
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-3" />
                <div className="h-5 bg-slate-50 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* STATS */}
      <div className="dashboard-stats">
        <div
          className="stats-card blue cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          onClick={() => navigate('/user/saved-properties')}
        >
          <div className="stats-card-header">
            <div className="stats-card-info">
              <p>Saved Properties</p>
              <h2>{stats.saved}</h2>
            </div>
            <div className="stats-card-icon">
              <Heart className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div
          className="stats-card emerald cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          onClick={() => navigate('/user/bookings')}
        >
          <div className="stats-card-header">
            <div className="stats-card-info">
              <p>Total Bookings</p>
              <h2>{stats.bookings}</h2>
            </div>
            <div className="stats-card-icon">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div
          className="stats-card orange cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          onClick={() => navigate('/user/property-visits')}
        >
          <div className="stats-card-header">
            <div className="stats-card-info">
              <p>Property Visits</p>
              <h2>{stats.visits}</h2>
            </div>
            <div className="stats-card-icon">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div
          className="stats-card purple cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          onClick={() => navigate('/user/messages')}
        >
          <div className="stats-card-header">
            <div className="stats-card-info">
              <p>Messages</p>
              <h2>{stats.messages}</h2>
            </div>
            <div className="stats-card-icon">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* PERSONAL INFO */}
      <div className="dashboard-card">
        {/* HEADER */}
        <div className="card-header">
          <div>
            <h2>Personal Information</h2>
            <p className="profile-subtitle">
              Manage your account details and contact information
            </p>
          </div>
          <button
            className="edit-profile-btn"
            onClick={() => navigate('/user/settings')}
          >
            Edit Profile
          </button>
        </div>

        {/* INFO GRID */}
        <div className="info-grid">
          <div className="info-box">
            <label>FULL NAME</label>
            <p>{user?.displayName || '—'}</p>
          </div>

          <div className="info-box">
            <label>EMAIL ADDRESS</label>
            <p>{user?.email || '—'}</p>
          </div>

          <div className="info-box">
            <label>PHONE NUMBER</label>
            <p>{user?.phoneNumber || 'Not provided'}</p>
          </div>

          <div className="info-box">
            <label>LOCATION</label>
            <p>{user?.location || 'Not provided'}</p>
          </div>

          <div className="info-box">
            <label>ACCOUNT TYPE</label>
            <p>{user?.accountType || 'Property Buyer'}</p>
          </div>

          <div className="info-box">
            <label>MEMBER SINCE</label>
            <p>{user?.memberSince || (user ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—')}</p>
          </div>

          <div className="info-box">
            <label>SAVED PROPERTIES</label>
            <p>{stats.saved || 0} Properties</p>
          </div>

          <div className="info-box">
            <label>PROPERTY VISITS</label>
            <p>{stats.visits ?? 0} Scheduled Visits</p>
          </div>
        </div>
      </div>

      {/* BOOKINGS */}
      <div className="dashboard-card">
        <div className="card-header">
          <h2>Recent Bookings</h2>
          <button
            onClick={() => navigate('/user/bookings')}
            className="px-6 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
          >
            View All
          </button>
        </div>
        {recentBookings.length > 0 ? (
          recentBookings.map(booking => (
            <div key={booking.id} className="booking-item">
              <div className="booking-info-wrapper">
                <div className="booking-icon">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="booking-info">
                  <h3>{booking.propertyName}</h3>
                  <p>Visit: {booking.bookingDate || 'Scheduled'}</p>
                </div>
              </div>
              <span className="booking-status bg-blue-600 text-white">
                {booking.status?.toUpperCase() || 'CONFIRMED'}
              </span>
            </div>
          ))
        ) : (
          <div className="booking-item">
            <div className="booking-info-wrapper">
              <div className="booking-icon">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="booking-info">
                <h3>No Recent Bookings</h3>
                <p>Start exploring properties to book a visit</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserProfile;
