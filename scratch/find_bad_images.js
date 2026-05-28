import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  const [key, ...val] = line.split('=');
  if(key && val.length > 0) {
    envVars[key.trim()] = val.join('=').trim().replace(/"/g, '').replace(/'/g, '');
  }
});

const config = {
  apiKey: envVars.VITE_FIREBASE_API_KEY,
  authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envVars.VITE_FIREBASE_APP_ID
};

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

async function findBad() {
  console.log("Authenticating...");
  await signInWithEmailAndPassword(auth, "vishalratanshakya@gmail.com", "vishal123");
  const snapshot = await getDocs(collection(db, 'properties'));
  for (const document of snapshot.docs) {
    const data = document.data();
    let isBad = false;
    if (!data.mainImage || data.mainImage.trim() === '') isBad = true;
    if (!data.images || data.images.length === 0) isBad = true;
    if (data.images && data.images.some(img => !img || img.trim() === '')) isBad = true;
    
    if (isBad) {
      console.log(`Property ${document.id} (${data.title}) has missing images! mainImage: ${data.mainImage}`);
      // FIX IT
      const luxury = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800';
      await updateDoc(doc(db, 'properties', document.id), {
        mainImage: data.mainImage || luxury,
        images: (!data.images || data.images.length === 0) ? [luxury] : data.images.map(img => img || luxury),
        subImages: (!data.subImages || data.subImages.length === 0) ? [luxury, luxury] : data.subImages.map(img => img || luxury)
      });
      console.log(`Fixed ${document.id}`);
    }
  }
  console.log("Done checking!");
  process.exit(0);
}

findBad();
