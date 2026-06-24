import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  documentId
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { notificationService } from './notificationService';

import { cloudinaryService } from './cloudinaryService';
export { cloudinaryService };

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase is configured
const isFirebaseConfigured = firebaseConfig.apiKey && 
                              firebaseConfig.projectId && 
                              firebaseConfig.appId;

let app = null;
let auth = null;
let db = null;
let storage = null;
let messaging = null;

// Initialize Firebase only if configured
if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.log('Firebase Messaging not supported in this environment');
    }
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase is not configured. Using dummy data only.');
}

// Data Sanitization Helper to remove undefined fields before writing to Firestore
const sanitizeData = (data) => {
  if (data === null || data === undefined) return null;
  const sanitized = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) && !(data[key] instanceof Date)) {
        sanitized[key] = sanitizeData(data[key]);
      } else {
        sanitized[key] = data[key];
      }
    }
  });
  return sanitized;
};

// Authentication Services
export const authService = {
  signInWithPhone: async (phoneNumber, recaptchaVerifier) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add Firebase credentials to .env file.');
    }
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      throw error;
    }
  },

  verifyOTP: async (confirmationResult, otp) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add Firebase credentials to .env file.');
    }
    try {
      const result = await confirmationResult.confirm(otp);
      return result.user;
    } catch (error) {
      throw error;
    }
  },

  signInWithEmail: async (email, password) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add Firebase credentials to .env file.');
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  signUpWithEmail: async (email, password) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add Firebase credentials to .env file.');
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      sessionStorage.clear();
      window.location.href = '/auth/login'; // Force redirect to login
    } catch (error) {
      console.error('Logout error:', error);
      sessionStorage.clear();
      window.location.href = '/auth/login';
    }
  },

  silentLogout: async () => {
    try {
      if (isFirebaseConfigured && auth) {
        await signOut(auth);
      }
      sessionStorage.clear();
    } catch (error) {
      console.error('Silent logout error:', error);
      sessionStorage.clear();
    }
  },

  resetPassword: async (email) => {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add Firebase credentials to .env file.');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  },

  onAuthStateChange: (callback) => {
    if (!isFirebaseConfigured) {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser: () => {
    if (!isFirebaseConfigured) {
      return null;
    }
    return auth.currentUser;
  },

  updateUserProfile: async (data) => {
    if (!isFirebaseConfigured || !auth.currentUser) {
      console.warn('Firebase not configured or user not authenticated. Cannot update Firebase profile.');
      return;
    }
    try {
      await updateProfile(auth.currentUser, data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  updateUserDoc: async (userId, data) => {
    if (!isFirebaseConfigured || !db) return;
    try {
      const sanitizedData = sanitizeData(data);
      await updateDoc(doc(db, 'users', userId), {
        ...sanitizedData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      // If doc doesn't exist, try setting it
      if (error.code === 'not-found') {
        const sanitizedData = sanitizeData(data);
        await setDoc(doc(db, 'users', userId), {
          ...sanitizedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return true;
      }
      throw error;
    }
  },
};

// Firestore Services
export const firestoreService = {
  // User Operations
  createUserDocument: async (userId, userData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      const sanitizedData = sanitizeData(userData);
      await setDoc(doc(db, 'users', userId), {
        ...sanitizedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  getUserDocument: async (userId) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return null;
    }
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (userId) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  updateUserStatus: async (userId, status) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  createAdminDocument: async (userId, userData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      const sanitizedData = sanitizeData(userData);
      await setDoc(doc(db, 'users', userId), {
        ...sanitizedData,
        role: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Failed to create admin document:', error);
      throw error;
    }
  },

  updateUserDocument: async (userId, userData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      const sanitizedData = sanitizeData(userData);
      // Use setDoc with merge:true so it works even if doc doesn't exist
      await setDoc(doc(db, 'users', userId), {
        ...sanitizedData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (error) {
      throw error;
    }
  },

  subscribeToUserDocument: (userId, callback) => {
    if (!isFirebaseConfigured || !db) return () => {};
    const userDocRef = doc(db, 'users', userId);
    return onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('User subscription error:', error);
      callback(null);
    });
  },

  subscribeToUsers: (callback) => {
    if (!isFirebaseConfigured || !db) {
      callback([]); // Ensure UI doesn't hang
      return () => {};
    }
    const usersColRef = collection(db, 'users');
    return onSnapshot(usersColRef, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(users);
    }, (error) => {
      console.error('Users subscription error:', error);
      callback([]);
    });
  },

  // Property Operations
  createProperty: async (propertyData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return 'dummy_id';
    }
    try {
      const docRef = await addDoc(collection(db, 'properties'), {
        ...propertyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Notification: Owner created property -> Notify Admin
      try {
        await notificationService.createNotification({
          userId: 'admin',
          title: 'New Property Listing',
          message: `A new property "${propertyData.title}" has been listed by ${propertyData.ownerName || 'a owner'}.`,
          type: 'property_created',
          propertyId: docRef.id
        });
      } catch (notifyError) {
        console.warn('Silent notification failure:', notifyError);
      }

      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  getProperties: async (filters = {}) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - use dummy data instead');
      return [];
    }
    try {
      let q = collection(db, 'properties');
      
      if (filters.ownerId) {
        q = query(q, where('ownerId', '==', filters.ownerId));
      }
      
      if (filters.category) {
        q = query(q, where('category', '==', filters.category));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
    } catch (error) {
      throw error;
    }
  },

  getProperty: async (propertyId) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return null;
    }
    try {
      const docSnap = await getDoc(doc(db, 'properties', propertyId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  updateProperty: async (propertyId, propertyData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      await updateDoc(doc(db, 'properties', propertyId), {
        ...propertyData,
        updatedAt: serverTimestamp(),
      });

      // Notification: Property updated -> Notify Admin
      await notificationService.createNotification('admin', 'Property Updated', `The property "${propertyData.title || 'ID: ' + propertyId}" has been updated.`, 'property_updated', { propertyId });

      return true;
    } catch (error) {
      throw error;
    }
  },

  deleteProperty: async (propertyId) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      return true;
    } catch (error) {
      throw error;
    }
  },

  subscribeToProperty: (propertyId, callback) => {
    if (!isFirebaseConfigured || !db) {
      console.warn('Firebase not configured - real-time property listener not available');
      return () => {};
    }
    const propertyDocRef = doc(db, 'properties', propertyId);
    return onSnapshot(propertyDocRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Property subscription error:', error);
      callback(null);
    });
  },

  // Order Operations
  createOrder: async (orderData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return 'dummy_order_id';
    }
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  getOrders: async (filters = {}) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - use dummy data instead');
      return [];
    }
    try {
      let q = collection(db, 'orders');
      
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }
      
      if (filters.ownerId) {
        q = query(q, where('ownerId', '==', filters.ownerId));
      }
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      q = query(q, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  getOrder: async (orderId) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return null;
    }
    try {
      const docSnap = await getDoc(doc(db, 'orders', orderId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  updateOrder: async (orderId, orderData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        ...orderData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Real-time Listeners
  subscribeToOrders: (filters, callback) => {
    if (!isFirebaseConfigured || !auth?.currentUser || !filters.userId || filters.userId === 'mock_user_id' || filters.userId === 'mock') {
      console.log('Using guest/mock state - order listeners disabled');
      // Fetch from session storage as fallback
      const allOrders = JSON.parse(sessionStorage.getItem('orders') || '[]');
      const filtered = filters.userId ? allOrders.filter(o => o.userId === filters.userId) : allOrders;
      callback(filtered);
      return () => {};
    }
    let q = collection(db, 'orders');
    
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    if (filters.ownerId) {
      q = query(q, where('ownerId', '==', filters.ownerId));
    }
    
    // Removed server-side orderBy to avoid index errors
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
      callback(orders);
    }, (error) => {
      console.error("Firestore Orders Subscription Error:", error);
    });
    
    return unsubscribe;
  },

  subscribeToProperties: (filters, callback) => {
    if (!isFirebaseConfigured || !db) {
      callback([]); // Ensure UI doesn't hang
      return () => {};
    }
    let q = collection(db, 'properties');
    
    if (filters.ownerId) {
      q = query(q, where('ownerId', '==', filters.ownerId));
    }
    
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    // Admin dashboard might want all properties, even inactive ones
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Removed server-side orderBy to avoid missing index errors. 
    // Sorting is now handled client-side.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const properties = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(properties);
    }, (error) => {
      console.error("Firestore Properties Subscription Error:", error);
      callback([]);
    });
    
    return unsubscribe;
  },

  // Owner Operations
  getOwners: async (filters = {}) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - use dummy data instead');
      return [];
    }
    try {
      let q = collection(db, 'owners');
      
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  updateOwner: async (ownerId, ownerData) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      await updateDoc(doc(db, 'owners', ownerId), {
        ...ownerData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  deleteOwner: async (ownerId) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping Firestore operation');
      return true;
    }
    try {
      await deleteDoc(doc(db, 'owners', ownerId));
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Analytics
  getAnalytics: async (collectionName, filters = {}) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - use dummy data instead');
      return [];
    }
    try {
      let q = collection(db, collectionName);
      
      if (filters.startDate) {
        q = query(q, where('createdAt', '>=', filters.startDate));
      }
      
      if (filters.endDate) {
        q = query(q, where('createdAt', '<=', filters.endDate));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw error;
    }
  },

  // Messaging & Conversations
  subscribeToUserConversations: (userId, callback) => {
    if (!isFirebaseConfigured || !db) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId)
      );

      return onSnapshot(q, (snapshot) => {
        const convos = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => {
            const dateA = a.updatedAt?.seconds || (a.updatedAt ? new Date(a.updatedAt).getTime() / 1000 : 0);
            const dateB = b.updatedAt?.seconds || (b.updatedAt ? new Date(b.updatedAt).getTime() / 1000 : 0);
            return dateB - dateA;
          });
        callback(convos);
      }, (error) => {
        console.error('Error in subscribeToUserConversations snapshot:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Failed to setup user conversations subscription:', error);
      callback([]);
      return () => {};
    }
  },

  subscribeToConversations: (filters, callback) => {
    if (!isFirebaseConfigured || !db) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'conversations'),
        where('ownerId', '==', filters.ownerId)
      );

      return onSnapshot(q, (snapshot) => {
        const convos = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .sort((a, b) => {
            const dateA = a.updatedAt?.seconds || (a.updatedAt ? new Date(a.updatedAt).getTime() / 1000 : 0);
            const dateB = b.updatedAt?.seconds || (b.updatedAt ? new Date(b.updatedAt).getTime() / 1000 : 0);
            return dateB - dateA;
          });
        callback(convos);
      }, (error) => {
        console.error('Error in subscribeToConversations snapshot:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Failed to setup conversations subscription:', error);
      callback([]);
      return () => {};
    }
  },

  subscribeToMessages: (conversationId, callback) => {
    if (!isFirebaseConfigured || !db) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(msgs);
      }, (error) => {
        console.error('Error in subscribeToMessages snapshot:', error);
        callback([]);
      });
    } catch (error) {
      console.error('Failed to setup messages subscription:', error);
      callback([]);
      return () => {};
    }
  },

  sendMessage: async (conversationData, messageData) => {
    if (!isFirebaseConfigured || !db) {
      console.warn('Firebase not configured - skipping sendMessage');
      return null;
    }

    try {
      const {
        ownerId,
        ownerName,
        ownerAvatar,
        userId,
        propertyId,
        propertyName,
        userName,
        userAvatar,
        propertyPrice
      } = conversationData;

      const convosQuery = query(
        collection(db, 'conversations'),
        where('ownerId', '==', ownerId),
        where('userId', '==', userId),
        where('propertyId', '==', propertyId)
      );

      const convoSnapshot = await getDocs(convosQuery);
      let conversationId;
      let unreadForOwner = 0;
      let unreadForUser = 0;
      const sender = messageData.sender;

      if (convoSnapshot.empty) {
        unreadForOwner = sender === 'user' ? 1 : 0;
        unreadForUser = sender === 'owner' ? 1 : 0;

        const convoRef = await addDoc(collection(db, 'conversations'), {
          ownerId,
          ownerName: ownerName || 'Property Owner',
          ownerAvatar: ownerAvatar || 'https://i.pravatar.cc/150?u=' + ownerId,
          ownerPhone: conversationData.ownerPhone || '',
          ownerEmail: conversationData.ownerEmail || '',
          userId,
          propertyId,
          property: propertyName,
          price: propertyPrice,
          name: userName,
          avatar: userAvatar || 'https://i.pravatar.cc/150?u=' + userId,
          status: 'online',
          unreadForOwner,
          unreadForUser,
          unread: unreadForOwner + unreadForUser,
          lastMessage: messageData.text,
          lastSender: sender,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        conversationId = convoRef.id;
      } else {
        conversationId = convoSnapshot.docs[0].id;
        const existing = convoSnapshot.docs[0].data();
        const existingUnreadForOwner = existing.unreadForOwner ?? (existing.unread && existing.lastSender !== 'owner' ? existing.unread : 0);
        const existingUnreadForUser = existing.unreadForUser ?? (existing.unread && existing.lastSender === 'owner' ? existing.unread : 0);

        if (sender === 'user') {
          unreadForOwner = existingUnreadForOwner + 1;
          unreadForUser = 0;
        } else {
          unreadForOwner = 0;
          unreadForUser = existingUnreadForUser + 1;
        }

        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: messageData.text,
          updatedAt: serverTimestamp(),
          lastSender: sender,
          unreadForOwner,
          unreadForUser,
          unread: unreadForOwner + unreadForUser
        });
      }

      const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        ...messageData,
        createdAt: serverTimestamp()
      });

      return { conversationId, messageId: messageRef.id };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  markAsRead: async (conversationId, role = 'user') => {
    if (!isFirebaseConfigured || !db) return;
    try {
      const convoRef = doc(db, 'conversations', conversationId);
      const convoSnap = await getDoc(convoRef);
      if (!convoSnap.exists()) return;

      const data = convoSnap.data();
      const existingUnreadForOwner = data.unreadForOwner ?? (data.unread && data.lastSender !== 'owner' ? data.unread : 0);
      const existingUnreadForUser = data.unreadForUser ?? (data.unread && data.lastSender === 'owner' ? data.unread : 0);
      const updated = {};

      if (role === 'owner') {
        updated.unreadForOwner = 0;
        updated.unread = existingUnreadForUser;
      } else {
        updated.unreadForUser = 0;
        updated.unread = existingUnreadForOwner;
      }

      await updateDoc(convoRef, updated);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  },

  deleteConversation: async (conversationId) => {
    if (!isFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'conversations', conversationId));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  },

  // Wishlist Operations
  toggleWishlist: async (userId, propertyId) => {
    if (!isFirebaseConfigured || !db) {
      console.warn('Firebase not configured for wishlist operations.');
      return false;
    }

    try {
      const wishlistId = `${userId}_${propertyId}`;
      const wishRef = doc(db, 'saved_properties', wishlistId);
      const wishSnap = await getDoc(wishRef);

      if (wishSnap.exists()) {
        await deleteDoc(wishRef);
        return false; // Removed
      } else {
        await setDoc(wishRef, {
          userId,
          propertyId,
          createdAt: serverTimestamp()
        });
        return true; // Added
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      throw error;
    }
  },

  getUserWishlist: async (userId) => {
    if (!isFirebaseConfigured || !db) {
      return [];
    }

    try {
      const q = query(collection(db, 'saved_properties'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data().propertyId);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  },

  getPropertiesByIds: async (ids) => {
    if (!ids || ids.length === 0) return [];
    if (!isFirebaseConfigured) return [];
    
    try {
      const propertiesRef = collection(db, 'properties');
      const chunks = [];
      for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
      }
      
      const results = [];
      for (const chunk of chunks) {
        const q = query(propertiesRef, where(documentId(), 'in', chunk));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
      }
      return results;
    } catch (error) {
      console.error('Error fetching properties by ids:', error);
      return [];
    }
  }
};

// Storage Services
export const storageService = {
  uploadFile: async (file, path) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping storage operation');
      return null;
    }
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      throw error;
    }
  },

  deleteFile: async (path) => {
    if (!isFirebaseConfigured) {
      console.warn('Firebase not configured - skipping storage operation');
      return true;
    }
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      throw error;
    }
  },
};

// Messaging Services
export const messagingService = {
  requestPermission: async () => {
    if (!isFirebaseConfigured || !messaging) {
      console.warn('Firebase not configured - messaging not available');
      return null;
    }
    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        // FCM requires a secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
          console.warn('FCM registration skipped: Not in a secure context');
          return null;
        }

        // Register service worker explicitly and wait for it to be active
        let registration;
        if ('serviceWorker' in navigator) {
          try {
            registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
            if (!registration) {
              registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            }
            
            // Wait for it to be active if it's not already
            if (registration.active?.state !== 'activated') {
              await navigator.serviceWorker.ready;
            }
            
            console.log('Service Worker is ready and active for FCM');
          } catch (swError) {
            console.error('Service Worker registration failed:', swError);
          }
        }

        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.error('FCM VAPID key is missing');
          return null;
        }

        console.log('Requesting FCM token with VAPID key...');
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration,
        });
        return token;
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  onMessage: (callback) => {
    if (!isFirebaseConfigured || !messaging) {
      console.warn('Firebase not configured - messaging not available');
      return () => {};
    }
    return onMessage(messaging, callback);
  },
};

// Booking Services
export const bookingService = {
  // Create a new booking
  createBooking: async (bookingData) => {
    // Fallback to mock if Firebase is not configured OR if user is not authenticated through Firebase
    if (!isFirebaseConfigured || !auth?.currentUser) {
      console.warn('Firebase not configured or user not authenticated. Using mock storage for booking.');
      const mockUserId = 'mock_user_id';
      const mockBookingId = 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const booking = {
        id: mockBookingId,
        ...bookingData,
        userId: bookingData.userId === 'anonymous' ? mockUserId : bookingData.userId,
        createdAt: new Date().toISOString(),
        bookingStatus: 'pending',
        paymentStatus: 'pending'
      };
      
      // Store in sessionStorage for demo
      const existingBookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      existingBookings.push(booking);
      sessionStorage.setItem('bookings', JSON.stringify(existingBookings));
      
      return mockBookingId;
    }

    try {
      // Sanitize data to remove undefined fields which Firestore doesn't like
      const sanitizedData = JSON.parse(JSON.stringify(bookingData));

      const bookingRef = await addDoc(collection(db, 'bookings'), {
        ...sanitizedData,
        createdAt: serverTimestamp(),
        bookingStatus: 'pending',
        paymentStatus: 'pending'
      });

      // Notification: New booking -> Notify Owner
      try {
        if (sanitizedData.ownerId) {
          await notificationService.createNotification({
            userId: sanitizedData.ownerId,
            title: 'New Booking Received',
            message: `You have received a new booking for "${sanitizedData.propertyName || 'your property'}".`,
            type: 'new_booking',
            data: { bookingId: bookingRef.id }
          });
        }

        // Notification: New booking -> Notify Admin
        await notificationService.createNotification({
          userId: 'admin',
          title: 'New Platform Booking',
          message: `A new booking has been placed for "${sanitizedData.propertyName || 'a property'}".`,
          type: 'new_booking',
          data: { bookingId: bookingRef.id }
        });

        // Notification: New booking -> Notify User (The one who booked)
        if (sanitizedData.userId) {
          await notificationService.createNotification({
            userId: sanitizedData.userId,
            title: 'Booking Request Submitted',
            message: `Your booking request for "${sanitizedData.propertyName || 'the property'}" has been received. The owner will confirm soon.`,
            type: 'booking_request',
            data: { bookingId: bookingRef.id }
          });
        }
      } catch (notifyError) {
        console.warn('Failed to send booking notifications:', notifyError);
        // We don't throw here as the booking itself was successful
      }

      return bookingRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },
  
  createOrder: async (orderData) => {
    // Fallback to mock if Firebase is not configured OR if user is not authenticated through Firebase
    if (!isFirebaseConfigured || !auth.currentUser) {
      console.warn('Firebase not configured or user not authenticated. Using mock storage for order.');
      const mockOrderId = 'order_' + Math.random().toString(36).substr(2, 9);
      const orders = JSON.parse(sessionStorage.getItem('orders') || '[]');
      orders.push({ 
        id: mockOrderId, 
        ...orderData, 
        createdAt: new Date().toISOString(),
        orderStatus: orderData.orderStatus || 'pending',
        paymentStatus: orderData.paymentInfo?.method === 'COD' ? 'pending' : 'completed'
      });
      sessionStorage.setItem('orders', JSON.stringify(orders));
      return mockOrderId;
    }

    try {
      // Sanitize data to remove undefined fields which Firestore doesn't like
      const sanitizedData = JSON.parse(JSON.stringify(orderData));

      const orderRef = await addDoc(collection(db, 'orders'), {
        ...sanitizedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        orderStatus: orderData.orderStatus || 'pending',
        paymentStatus: orderData.paymentInfo?.method === 'COD' ? 'pending' : 'completed'
      });
      return orderRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get all bookings (for admin)
  getAllBookings: (callback) => {
    if (!isFirebaseConfigured) {
      // Mock implementation for demo mode
      const bookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      callback(bookings);
      return () => {}; // Return unsubscribe function
    }

    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(bookings);
    }, (error) => {
      console.error('Error in getAllBookings snapshot:', error);
      callback([]);
    });
  },

  // Get single booking
  getBooking: async (bookingId) => {
    if (!isFirebaseConfigured) {
      const bookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      return bookings.find(b => b.id === bookingId) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, 'bookings', bookingId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Get bookings for a specific owner
  getOwnerBookings: (ownerId, callback) => {
    if (!isFirebaseConfigured) {
      // Mock implementation for demo mode
      const allBookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      const ownerBookings = allBookings.filter(booking => booking.ownerId === ownerId);
      callback(ownerBookings);
      return () => {}; // Return unsubscribe function
    }

    const q = query(
      collection(db, 'bookings'), 
      where('ownerId', '==', ownerId)
    );
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
      callback(bookings);
    }, (error) => {
      console.error('Error in getOwnerBookings snapshot:', error);
      callback([]);
    });
  },

  // Get bookings for a specific user
  getUserBookings: (userId, callback) => {
    // Check for Firebase OR auth status OR if it's a mock userId
    const isMockId = userId === 'mock_user_id' || userId === 'mock';
    if (!isFirebaseConfigured || !auth?.currentUser || isMockId) {
      if (isFirebaseConfigured && auth?.currentUser && isMockId) {
        console.warn('Authenticated but using mock ID. Falling back to local storage for bookings.');
      } else if (!isFirebaseConfigured || !auth?.currentUser) {
        console.warn('Firebase not configured or user not authenticated. Fetching bookings from mock storage.');
      }
      
      const allBookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      const userBookings = allBookings.filter(booking => booking.userId === userId);
      callback(userBookings);
      return () => {}; // Return unsubscribe function
    }

    const q = query(
      collection(db, 'bookings'), 
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const bookings = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
      callback(bookings);
    }, (error) => {
      console.error('Error in getUserBookings snapshot:', error);
      callback([]);
    });
  },

  // Get orders for a specific user
  getUserOrders: async (userId) => {
    // Check for Firebase OR auth status OR if it's a mock userId
    const isMockId = userId === 'mock_user_id' || userId === 'mock';
    if (!isFirebaseConfigured || !auth?.currentUser || isMockId) {
      if (isFirebaseConfigured && auth?.currentUser && isMockId) {
        console.warn('Authenticated but using mock ID. Falling back to local storage for orders.');
      } else if (!isFirebaseConfigured || !auth?.currentUser) {
        console.warn('Firebase not configured or user not authenticated. Fetching orders from mock storage.');
      }
      
      const allOrders = JSON.parse(sessionStorage.getItem('orders') || '[]');
      return allOrders.filter(order => order.userId === userId);
    }

    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status) => {
    if (!isFirebaseConfigured) {
      // Mock implementation for demo mode
      const bookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      const bookingIndex = bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex !== -1) {
        bookings[bookingIndex].bookingStatus = status;
        sessionStorage.setItem('bookings', JSON.stringify(bookings));
      }
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { bookingStatus: status });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Delete booking
  deleteBooking: async (bookingId) => {
    if (!isFirebaseConfigured) {
      // Mock implementation for demo mode
      const bookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      const updated = bookings.filter(b => b.id !== bookingId);
      sessionStorage.setItem('bookings', JSON.stringify(updated));
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await deleteDoc(bookingRef);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  },

  // Update payment status
  updatePaymentStatus: async (bookingId, status) => {
    if (!isFirebaseConfigured) {
      // Mock implementation for demo mode
      const bookings = JSON.parse(sessionStorage.getItem('bookings') || '[]');
      const bookingIndex = bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex !== -1) {
        bookings[bookingIndex].paymentStatus = status;
        sessionStorage.setItem('bookings', JSON.stringify(bookings));
      }
      return;
    }

    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, { paymentStatus: status });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Get reviews for a specific owner
  subscribeToReviews: (filters, callback, onError) => {
    if (!isFirebaseConfigured || !db) {
      const allReviews = JSON.parse(sessionStorage.getItem('reviews') || '[]');
      const ownerReviews = filters.ownerId 
        ? allReviews.filter(review => review.ownerId === filters.ownerId)
        : allReviews;
      callback(ownerReviews);
      return () => {};
    }

    let q = collection(db, 'reviews');
    if (filters.ownerId) {
      q = query(q, where('ownerId', '==', filters.ownerId));
    }

    return onSnapshot(q, (snapshot) => {
      const reviews = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
      callback(reviews);
    }, (error) => {
      console.error('Error in subscribeToReviews snapshot:', error);
      if (onError) onError(error);
      callback([]);
    });
  },

  updateReview: async (reviewId, reviewData) => {
    if (!isFirebaseConfigured || !db) {
      const allReviews = JSON.parse(sessionStorage.getItem('reviews') || '[]');
      const updated = allReviews.map(r => r.id === reviewId ? { ...r, ...reviewData } : r);
      sessionStorage.setItem('reviews', JSON.stringify(updated));
      return true;
    }
    try {
      await updateDoc(doc(db, 'reviews', reviewId), reviewData);
      return true;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  deleteReview: async (reviewId) => {
    if (!isFirebaseConfigured || !db) {
      const allReviews = JSON.parse(sessionStorage.getItem('reviews') || '[]');
      const filtered = allReviews.filter(r => r.id !== reviewId);
      sessionStorage.setItem('reviews', JSON.stringify(filtered));
      return true;
    }
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      return true;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },
  // Transaction Operations
  createTransaction: async (transactionData) => {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      console.warn('Firebase not configured or user not authenticated. Using mock storage for transaction.');
      const mockTransId = 'trans_' + Date.now();
      const transactions = JSON.parse(sessionStorage.getItem('transactions') || '[]');
      transactions.push({ id: mockTransId, ...transactionData, createdAt: new Date().toISOString() });
      sessionStorage.setItem('transactions', JSON.stringify(transactions));
      return mockTransId;
    }

    try {
      const transRef = await addDoc(collection(db, 'transactions'), {
        ...transactionData,
        createdAt: serverTimestamp()
      });
      return transRef.id;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  },

  getUserTransactions: async (userId) => {
    if (!isFirebaseConfigured || !auth?.currentUser) {
      const allTrans = JSON.parse(sessionStorage.getItem('transactions') || '[]');
      return allTrans.filter(t => t.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    try {
      const q = query(collection(db, 'transactions'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const dateA = a.createdAt?.seconds || (a.createdAt ? new Date(a.createdAt).getTime() / 1000 : 0);
          const dateB = b.createdAt?.seconds || (b.createdAt ? new Date(b.createdAt).getTime() / 1000 : 0);
          return dateB - dateA;
        });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },
};

// Attach misplaced functions to firestoreService for backwards compatibility
Object.assign(firestoreService, {
  subscribeToReviews: bookingService.subscribeToReviews,
  updateReview: bookingService.updateReview,
  deleteReview: bookingService.deleteReview,
  createTransaction: bookingService.createTransaction,
  getUserTransactions: bookingService.getUserTransactions
});

export { app, auth, db, storage, messaging };

export default firestoreService;
