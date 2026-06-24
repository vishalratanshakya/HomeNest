import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
const UserAuth = lazy(() => import('../../auth/pages/UserAuth.jsx'));
const AdminLogin = lazy(() => import('../../auth/pages/AdminLogin.jsx'));
const OwnerAuth = lazy(() => import('../../auth/pages/OwnerAuth.jsx'));
const OTP = lazy(() => import('../../auth/pages/OTP.jsx'));

// Admin Pages
const AdminLayout = lazy(() => import('@admin/components/AdminLayout'));
const AdminDashboard = lazy(() => import('@admin/pages/Dashboard'));
const AdminUsers = lazy(() => import('@admin/pages/Users'));
const AdminOwners = lazy(() => import('@admin/pages/Owners'));
const AdminOrders = lazy(() => import('@admin/pages/Orders'));
const AdminAnalytics = lazy(() => import('@admin/pages/Analytics'));
const AdminSettings = lazy(() => import('@admin/pages/Settings'));
const AdminProperties = lazy(() => import('@admin/pages/Properties'));
const AdminAddProperty = lazy(() => import('@admin/pages/AddProperty'));
const AdminPayments = lazy(() => import('@admin/pages/Payments'));
const AdminReviews = lazy(() => import('@admin/pages/Reviews'));
const AdminReports = lazy(() => import('@admin/pages/Reports'));
const AdminNotifications = lazy(() => import('@admin/pages/Notifications'));

// Owner Pages
const OwnerDashboard = lazy(() => import('@owner/pages/Dashboard'));
const OwnerAddProperty = lazy(() => import('@owner/pages/AddProperty'));
const OwnerEditProperty = lazy(() => import('@owner/pages/EditProperty'));
const OwnerProperties = lazy(() => import('@owner/pages/Properties'));
const OwnerBookings = lazy(() => import('@owner/pages/Bookings'));
const OwnerEarnings = lazy(() => import('@owner/pages/Earnings'));
const OwnerProfile = lazy(() => import('@owner/pages/Profile'));
const OwnerReviews = lazy(() => import('@owner/pages/Reviews'));
const OwnerMessages = lazy(() => import('@owner/pages/Messages'));
const OwnerSettings = lazy(() => import('@owner/pages/Settings'));

// User Pages
const UserHome = lazy(() => import('@user/pages/Home'));
const UserSearch = lazy(() => import('@user/pages/Search'));
const UserBuyPage = lazy(() => import('@user/pages/BuyPage'));
const UserRentPage = lazy(() => import('@user/pages/RentPage'));
const UserProductDetails = lazy(() => import('@user/pages/ProductDetails'));
const UserOrderPage = lazy(() => import('@user/pages/OrderPage'));
const UserConfirmBooking = lazy(() => import('@user/pages/ConfirmBooking'));
const UserOrderTracking = lazy(() => import('@user/pages/OrderTracking'));
const UserPayment = lazy(() => import('@user/pages/Payment'));
const UserProfilePage = lazy(() => import('@user/pages/UserProfile'));
const UserSavedProperties = lazy(() => import('@user/pages/SavedProperties'));
const UserAllBookings = lazy(() => import('@user/pages/Bookings'));
const UserPropertyVisits = lazy(() => import('@user/pages/PropertyVisits'));
const UserTransactions = lazy(() => import('@user/pages/Transactions'));
const UserSettings = lazy(() => import('@user/pages/Settings'));
const UserNotifications = lazy(() => import('@user/pages/Notifications'));
const UserAbout = lazy(() => import('@user/pages/About'));
const UserContact = lazy(() => import('@user/pages/Contact'));
const UserPrivacyPreferences = lazy(() => import('@user/pages/PrivacyPreferences'));
const UserMessages = lazy(() => import('@user/pages/UserMessages'));
const UserPurchaseProperty = lazy(() => import('@user/pages/PurchaseProperty'));
const UserEditProfile = lazy(() => import('@user/pages/EditProfile'));
const UserDashboardLayout = lazy(() => import('@user/components/UserDashboardLayout'));
const OwnerNotifications = lazy(() => import('@owner/pages/Notifications'));
const UserBuyPropertyTracking = lazy(() => import('@user/pages/BuyPropertyTracking'));
const UserBookedPropertyTracking = lazy(() => import('@user/pages/BookedPropertyTracking'));
const OwnerBuyPropertyTracking = lazy(() => import('@owner/pages/BuyPropertyTracking'));
const OwnerBookedPropertyTracking = lazy(() => import('@owner/pages/BookedPropertyTracking'));

export default function AppRoutes() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    }>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/user/home" replace />} />
      
      {/* Auth Routes */}
      <Route path="/auth/login" element={<UserAuth />} />
      <Route path="/auth/signup" element={<UserAuth />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/owner/login" element={<OwnerAuth />} />
      <Route path="/auth/otp" element={<OTP />} />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="owners" element={<AdminOwners />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="add-property" element={<AdminAddProperty />} />
        <Route path="sell-properties" element={<AdminProperties type="sell" />} />
        <Route path="rent-properties" element={<AdminProperties type="rent" />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Owner Routes */}
      <Route
        path="/owner/dashboard"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/add-property"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerAddProperty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/edit-property/:id"
        element={
          <ProtectedRoute allowedRoles={['owner', 'admin']}>
            <OwnerEditProperty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/properties"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerProperties />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/bookings"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerBookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/earnings"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerEarnings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/reviews"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerReviews />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/profile"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/messages"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerMessages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/settings"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/notifications"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/tracking/buy"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerBuyPropertyTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner/tracking/book"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <OwnerBookedPropertyTracking />
          </ProtectedRoute>
        }
      />
      {/* Compatibility Aliases */}
      <Route path="/owner/products" element={<Navigate to="/owner/properties" replace />} />
      <Route path="/owner/orders" element={<Navigate to="/owner/bookings" replace />} />

      {/* User Routes */}
      <Route
        path="/user/home"
        element={<UserHome />}
      />
      <Route
        path="/user/sale"
        element={<UserBuyPage />}
      />
      <Route
        path="/user/buy"
        element={<Navigate to="/user/sale" replace />}
      />
      <Route
        path="/user/sale/:id"
        element={<UserProductDetails />}
      />
      <Route
        path="/user/buy/:id"
        element={<UserProductDetails />}
      />
      <Route
        path="/user/rent"
        element={<UserRentPage />}
      />
      <Route
        path="/user/rent/:id"
        element={<UserProductDetails />}
      />
      <Route
        path="/user/product/:id"
        element={<UserProductDetails />}
      />
      <Route
        path="/user/order"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserOrderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/confirm-booking/:id"
        element={
          <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
            <UserConfirmBooking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/purchase-property/:id"
        element={
          <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
            <UserPurchaseProperty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/tracking/:orderId"
        element={
          <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
            <UserOrderTracking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/payment"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserPayment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={['user', 'owner', 'admin']}>
            <UserDashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<UserProfilePage />} />
        <Route path="profile/edit" element={<UserEditProfile />} />
        <Route path="saved-properties" element={<UserSavedProperties />} />
        <Route path="bookings" element={<UserAllBookings />} />
        <Route path="property-visits" element={<UserPropertyVisits />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="settings" element={<UserSettings />} />
        <Route path="messages" element={<UserMessages />} />
        <Route path="search" element={<UserSearch />} />
        <Route path="notifications" element={<UserNotifications />} />
        <Route path="privacy" element={<UserPrivacyPreferences />} />
        <Route path="tracking/buy" element={<UserBuyPropertyTracking />} />
        <Route path="tracking/book" element={<UserBookedPropertyTracking />} />
      </Route>

      <Route
        path="/user/about"
        element={<UserAbout />}
      />
      <Route
        path="/user/contact"
        element={<UserContact />}
      />

      <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/user" element={<Navigate to="/user/home" replace />} />
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/user/home" replace />} />
      </Routes>
    </Suspense>
  );
}
