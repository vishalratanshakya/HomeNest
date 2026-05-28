import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

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
  projectId: envVars.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(config);
const db = getFirestore(app);

async function validateUrls() {
  const snapshot = await getDocs(collection(db, 'properties'));
  let badCount = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    const checkUrl = (url, field) => {
      if (url && typeof url === 'string' && !url.startsWith('http')) {
        console.log(`Bad URL in ${doc.id} [${field}]: ${url}`);
        badCount++;
      }
    };
    checkUrl(data.mainImage, 'mainImage');
    if (data.images) data.images.forEach(img => checkUrl(img, 'images'));
    if (data.subImages) data.subImages.forEach(img => checkUrl(img, 'subImages'));
  });
  console.log(`Found ${badCount} bad URLs.`);
  process.exit(0);
}

validateUrls();
