// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you're not using Firebase Hosting, import them from a CDN
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCvQnNvQwERE7AlURpbJhK3KL-Y8Qo6WPU",
  authDomain: "realstate-8bceb.firebaseapp.com",
  projectId: "realstate-8bceb",
  storageBucket: "realstate-8bceb.firebasestorage.app",
  messagingSenderId: "337506724975",
  appId: "1:337506724975:web:870c1d2311a2e72d69b19a"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/logo192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
