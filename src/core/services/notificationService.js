import { db, auth } from './firebaseService';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, updateDoc, doc, getDocs, getDoc } from 'firebase/firestore';
import { messagingService } from './firebaseService';

export const notificationService = {
  createNotification: async (notificationData) => {
    try {
      const docRef = await addDoc(collection(db, 'notifications'), {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  getNotifications: async (userId) => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || 0;
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || 0;
          return dateB - dateA;
        });
    } catch (error) {
      throw error;
    }
  },

  subscribeToNotifications: (userId, callback, userRole = null) => {
    // Safety check for mock users or unauthenticated state
    const isMock = !userId || userId === 'mock_user_id' || userId === 'mock';
    const isFirebaseUnauthenticated = !isMock && (!auth || !auth.currentUser);

    if (isMock || isFirebaseUnauthenticated || !db) {
      console.log('Using guest/mock state - notification listeners disabled');
      callback([]); // Return empty notifications for mock user
      return () => {};
    }

    // Build the audience list: [direct_uid, 'all', (optionally) role]
    const audiences = [userId, 'all'];
    if (userRole) audiences.push(userRole);

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', audiences),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => {
        const data = doc.data();
        // A broadcast notification is read if the user's ID is in the readBy array
        const isBroadcast = data.userId === 'all' || data.userId === 'owner' || data.userId === 'admin';
        const isRead = isBroadcast
          ? (data.readBy && Array.isArray(data.readBy) && data.readBy.includes(userId))
          : data.read;
        return {
          id: doc.id,
          ...data,
          read: !!isRead
        };
      });
      callback(notifications);
    }, (error) => {
      // Silently catch permission errors for better UX
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for notifications - user may not be authenticated yet');
      } else {
        console.error('Notification subscription error:', error);
      }
    });
    
    return unsubscribe;
  },

  markAsRead: async (notificationId, userId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      const notifSnap = await getDoc(notifRef);
      if (notifSnap.exists()) {
        const notifData = notifSnap.data();
        const isBroadcast = notifData.userId === 'all' || notifData.userId === 'owner' || notifData.userId === 'admin';
        if (isBroadcast) {
          const readBy = notifData.readBy || [];
          if (!readBy.includes(userId)) {
            await updateDoc(notifRef, {
              readBy: [...readBy, userId]
            });
          }
        } else {
          await updateDoc(notifRef, {
            read: true,
            readAt: serverTimestamp(),
          });
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async (userId, userRole = null) => {
    try {
      const audiences = [userId, 'all'];
      if (userRole) audiences.push(userRole);

      const q = query(
        collection(db, 'notifications'),
        where('userId', 'in', audiences)
      );
      
      const snapshot = await getDocs(q);
      const updatePromises = snapshot.docs.map(async (doc) => {
        const notifData = doc.data();
        const isBroadcast = notifData.userId === 'all' || notifData.userId === 'owner' || notifData.userId === 'admin';
        if (isBroadcast) {
          const readBy = notifData.readBy || [];
          if (!readBy.includes(userId)) {
            return updateDoc(doc.ref, {
              readBy: [...readBy, userId]
            });
          }
        } else {
          if (!notifData.read) {
            return updateDoc(doc.ref, { read: true, readAt: serverTimestamp() });
          }
        }
      });
      
      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      throw error;
    }
  },

  sendOrderNotification: async (userId, orderId, message, type = 'order') => {
    return notificationService.createNotification({
      userId,
      type,
      title: 'Order Update',
      message,
      orderId,
      actionUrl: `/order/${orderId}`,
    });
  },

  sendOwnerNotification: async (ownerId, message, type = 'owner') => {
    return notificationService.createNotification({
      userId: ownerId,
      type,
      title: 'Owner Update',
      message,
      actionUrl: '/owner/dashboard',
    });
  },

  sendAdminNotification: async (message, type = 'admin') => {
    return notificationService.createNotification({
      userId: 'admin',
      type,
      title: 'Admin Alert',
      message,
      actionUrl: '/admin/dashboard',
    });
  },

  registerPushNotification: async (userId, token) => {
    try {
      await addDoc(collection(db, 'userTokens'), {
        userId,
        token,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  sendPushNotification: async (userId, title, body, data = {}) => {
    try {
      const q = query(collection(db, 'userTokens'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const tokens = snapshot.docs.map(doc => doc.data().token);
      
      // This would typically use Firebase Cloud Functions or a backend service
      // For now, we'll store the notification in Firestore
      await notificationService.createNotification({
        userId,
        type: 'push',
        title,
        message: body,
        data,
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  },
};
