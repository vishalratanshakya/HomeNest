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

async function updateImages() {
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
    let newImages = [...(data.images || [])];

    // If it's using source.unsplash.com or has bad studio images
    if (newMain && (newMain.includes('source.unsplash.com') || newMain.includes('loremflickr.com') || newMain.includes('studio'))) {
       newMain = luxuryImages[Math.floor(Math.random() * luxuryImages.length)];
       changed = true;
    }

    newImages = newImages.map(img => {
      if (img.includes('source.unsplash.com') || img.includes('loremflickr.com') || img.includes('studio')) {
        changed = true;
        return luxuryImages[Math.floor(Math.random() * luxuryImages.length)];
      }
      return img;
    });

    if (changed) {
      await updateDoc(doc(db, 'properties', document.id), {
        mainImage: newMain,
        images: newImages
      });
      updated++;
      console.log(`Updated images for property ${data.title}`);
    }
  }
  
  console.log(`Successfully updated ${updated} properties.`);
  process.exit(0);
}

updateImages();
