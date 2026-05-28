import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@core/services/firebaseService';
import { firestoreService } from '@core/services/firebaseService';

export default function ProtectedRoute({ children, allowedRoles }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // First check sessionStorage for mock auth (when Firebase is not configured)
    const mockUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (mockUser) {
      if (allowedRoles && !allowedRoles.includes(mockUser.role)) {
        navigate('/unauthorized');
        return;
      }
      setUserRole(mockUser.role);
      setLoading(false);
      return;
    }

    // Subscribe to Firebase auth state
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (!user) {
        // Determine login path based on current URL path
        let loginPath = '/auth/login';
        if (window.location.pathname.startsWith('/admin')) {
          loginPath = '/admin/login';
        } else if (window.location.pathname.startsWith('/vendor')) {
          loginPath = '/vendor/login';
        }
        
        navigate(loginPath);
        setLoading(false);
        return;
      }

      try {
        // Get user role from Firestore
        const userDoc = await firestoreService.getUserDocument(user.uid);
        const role = userDoc?.role || 'user';

        // Check if user has required role
        if (allowedRoles && !allowedRoles.includes(role)) {
          navigate('/unauthorized');
          setLoading(false);
          return;
        }

        setUserRole(role);
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/auth/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return children;
}
