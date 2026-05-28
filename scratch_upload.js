import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyCvQnNvQwERE7AlURpbJhK3KL-Y8Qo6WPU",
  authDomain: "realstate-8bceb.firebaseapp.com",
  projectId: "realstate-8bceb",
  storageBucket: "realstate-8bceb.firebasestorage.app",
  messagingSenderId: "337506724975",
  appId: "1:337506724975:web:870c1d2311a2e72d69b19a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const normalizeData = (data) => {
  const listingType = data.listingType || "sale";
  let price = data.pricing?.price || data.price || 0;
  let securityDeposit = data.pricing?.securityDeposit || 0;

  if (listingType === "sale") {
    securityDeposit = 0;
  } else if (listingType === "rent") {
    if (!securityDeposit) securityDeposit = price * 2;
  }

  return {
    ...data,
    listingType,
    pricing: {
      price,
      securityDeposit,
      negotiable: data.pricing?.negotiable ?? false
    }
  };
};

async function uploadData() {
  try {
    const dataPath = 'C:\\Users\\Vishal\\.gemini\\antigravity\\brain\\93725b04-4bbf-4d27-b68d-82dc65c1083f\\bulk_property_data.json';
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const properties = JSON.parse(rawData);

    console.log(`Starting upload of ${properties.length} properties...`);

    for (let i = 0; i < properties.length; i++) {
      let data = properties[i];
      data = normalizeData(data);

      const slug = data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, '');

      const propertyToUpload = {
        ...data,
        slug,
        vendorId: 'admin_bulk_upload',
        vendorName: 'Premium Real Estate',
        vendorPhone: '+91 99999 99999',
        status: data.status || 'active',
        category: data.listingType,
        createdAt: new Date(),
        updatedAt: new Date(),
        price: data.pricing.price,
        location: data.location.city,
        type: data.type || 'Property'
      };

      const docRef = await addDoc(collection(db, "properties"), propertyToUpload);
      console.log(`[${i + 1}/${properties.length}] Uploaded: ${data.title} (ID: ${docRef.id})`);
    }

    console.log('\n✅ All properties uploaded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during upload:', error);
    process.exit(1);
  }
}

uploadData();
