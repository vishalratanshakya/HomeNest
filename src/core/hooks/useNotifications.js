import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { messagingService, auth } from '../services/firebaseService';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';

export const useNotifications = (userId, userRole = null) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth?.currentUser || null);

  // Sync auth state
  useEffect(() => {
    if (!auth) return;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const isMock = !userId || userId === 'mock_user_id' || userId === 'mock';
    // If not mock and user is not authenticated yet, wait for auth to initialize
    if (!userId || (!isMock && !currentUser)) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // 1. Subscribe to Firestore notifications (Real-time in-app)
    // Pass userRole to allow for role-based broadcasts (e.g., 'vendor', 'user')
    const unsubscribe = notificationService.subscribeToNotifications(userId, (data) => {
      setNotifications(data);
      const unread = data.filter(n => !n.read).length;
      setUnreadCount(unread);
      setLoading(false);
      
      // If a new notification arrives, show a toast
      if (data.length > 0 && !data[0].read && unread > 0) {
        const now = new Date().getTime();
        const created = data[0].createdAt?.toDate?.().getTime() || 0;
        if (now - created < 5000) {
          toast.success(data[0].title + ': ' + data[0].message);
        }
      }
    }, userRole);

    // 2. Setup FCM (Push Notifications)
    const setupFCM = async () => {
      // Basic check for environment support
      if (!('serviceWorker' in navigator) || !('Notification' in window)) {
        console.warn('Push notifications are not supported in this environment');
        return;
      }

      try {
        const token = await messagingService.requestPermission();
        if (token) {
          await notificationService.registerPushNotification(userId, token);
          console.log('FCM Token registered successfully');
        }
      } catch (error) {
        // Only log if it's not a common expected failure like permission denied or AbortError
        if (error.name !== 'AbortError' && error.code !== 'messaging/permission-blocked') {
          console.error('FCM Setup failed:', error);
        }
      }
    };

    setupFCM();

    // 3. Listen for foreground FCM messages
    const unsubscribeFCM = messagingService.onMessage((payload) => {
      console.log('Foreground message received:', payload);
      toast.success(payload.notification.title + ': ' + payload.notification.body);
    });

    return () => {
      unsubscribe();
      unsubscribeFCM();
    };
  }, [userId, currentUser, userRole]);

  const markAsRead = async (id) => {
    await notificationService.markAsRead(id, userId);
  };

  const markAllAsRead = async () => {
    if (userId) {
      await notificationService.markAllAsRead(userId, userRole);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  };
};
