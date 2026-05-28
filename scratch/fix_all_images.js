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

function isBadImage(url) {
  if (!url) return true;
  if (url.includes('source.unsplash.com')) return true;
  if (url.includes('loremflickr.com')) return true;
  if (url.includes('studio')) return true;
  if (url.includes('placeholder')) return true;
  return false;
}

function getRandomImage() {
  return luxuryImages[Math.floor(Math.random() * luxuryImages.length)];
}

async function fixAllImages() {
  console.log("Authenticating as Admin...");
  await signInWithEmailAndPassword(auth, "vishalratanshakya@gmail.com", "vishal123");
  console.log("Authenticated successfully!");
  
  console.log("Fetching properties...");
  const snapshot = await getDocs(collection(db, 'properties'));
  let updated = 0;
  
  for (const document of snapshot.docs) {
    const data = document.data();
    let changed = false;
    let newMain = data.mainImage;
    let newImages = Array.isArray(data.images) ? [...data.images] : [];
    let newSubImages = Array.isArray(data.subImages) ? [...data.subImages] : [];

    if (isBadImage(newMain)) {
       newMain = getRandomImage();
       changed = true;
    }

    newImages = newImages.map(img => {
      if (isBadImage(img)) {
        changed = true;
        return getRandomImage();
      }
      return img;
    });

    newSubImages = newSubImages.map(img => {
      if (isBadImage(img)) {
        changed = true;
        return getRandomImage();
      }
      return img;
    });
    
    if (newImages.length === 0) {
      newImages = [newMain, getRandomImage(), getRandomImage()];
      changed = true;
    }
    
    if (newSubImages.length === 0) {
      newSubImages = [getRandomImage(), getRandomImage(), getRandomImage()];
      changed = true;
    }

    if (changed) {
      await updateDoc(doc(db, 'properties', document.id), {
        mainImage: newMain,
        images: newImages,
        subImages: newSubImages
      });
      updated++;
      console.log(`Updated all images for property ${data.title}`);
    }
  }
  
  console.log(`Successfully fixed images for ${updated} properties.`);
  process.exit(0);
}

fixAllImages();
