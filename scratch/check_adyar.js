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

async function checkAdyar() {
  const snapshot = await getDocs(collection(db, 'properties'));
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.title && (data.title.includes('Adyar 10') || data.title.includes('Indiranagar 4'))) {
      console.log(data.title, '=>', data.mainImage);
    }
  });
  process.exit(0);
}

checkAdyar();
