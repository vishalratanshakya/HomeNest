import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(config);
const db = getFirestore(app);

async function checkImages() {
  const q = query(collection(db, 'properties'), limit(10));
  const snapshot = await getDocs(q);
  
  const properties = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    properties.push({
      id: doc.id,
      type: data.type,
      title: data.title,
      images: data.images || []
    });
  });
  
  console.log(JSON.stringify(properties, null, 2));
  process.exit(0);
}

checkImages();
