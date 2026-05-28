import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import https from "https";

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

const luxuryImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  'https://images.unsplash.com/photo-1600607687931-ce8a6c25118c?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
  'https://images.unsplash.com/photo-1600585154526-990dced4ea0d?w=800',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800'
];

async function checkUrl(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`URL failed: ${url} (Status: ${res.status})`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`URL error: ${url}`, e.message);
    return false;
  }
}

async function run() {
  console.log("Checking valid URLs...");
  const validUrls = [];
  const badUrls = [];
  
  for (const url of luxuryImages) {
    const isValid = await checkUrl(url);
    if (isValid) {
      validUrls.push(url);
    } else {
      badUrls.push(url);
    }
  }
  
  console.log(`Found ${validUrls.length} valid, ${badUrls.length} bad.`);
  
  if (badUrls.length === 0) {
    console.log("No bad URLs found, exiting.");
    process.exit(0);
  }
  
  console.log("Authenticating to fix database...");
  await signInWithEmailAndPassword(auth, "vishalratanshakya@gmail.com", "vishal123");
  
  const snapshot = await getDocs(collection(db, 'properties'));
  let fixedCount = 0;
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    let changed = false;
    
    let newMain = data.mainImage;
    let newImages = Array.isArray(data.images) ? [...data.images] : [];
    let newSubImages = Array.isArray(data.subImages) ? [...data.subImages] : [];
    
    const isBad = (url) => badUrls.some(b => url && url.includes(b.split('?')[0]));
    
    const getValid = () => validUrls[Math.floor(Math.random() * validUrls.length)];
    
    if (isBad(newMain)) {
      newMain = getValid();
      changed = true;
    }
    
    newImages = newImages.map(img => {
      if (isBad(img)) { changed = true; return getValid(); }
      return img;
    });
    
    newSubImages = newSubImages.map(img => {
      if (isBad(img)) { changed = true; return getValid(); }
      return img;
    });
    
    if (changed) {
      await updateDoc(doc(db, 'properties', docSnap.id), {
        mainImage: newMain,
        images: newImages,
        subImages: newSubImages
      });
      fixedCount++;
      console.log(`Fixed property ${docSnap.id}`);
    }
  }
  
  console.log(`Fixed ${fixedCount} properties with broken Unsplash links.`);
  process.exit(0);
}

run();
