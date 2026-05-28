import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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
const auth = getAuth(app);

const types = ['Apartment', 'Villa', 'House'];
const baseImages = [
  '1600596542815-ffad4c1539a9', '1512917774080-9991f1c4c750', '1600585154340-be6161a56a0c', 
  '1600607687939-ce8a6c25118c', '1600566753190-17f0baa2a6c3', '1600573472550-8090b5e0745e', 
  '1600047509807-ba8f99d2cdde', '1522708323590-d24dbb6b0267', '1583608205776-bfd35f0d9f83', 
  '1564013799919-ab600027ffc6', '1560448204-e02f11c3d0e2', '1484154218962-a197022b5858',
  '1502672260266-1c1de2d9d000', '1554995207-c18c203602cb', '1580587771525-78b9dba3b914',
  '1493809842364-78817add7ffb', '1505843513577-22bb7d21e455', '1510798831971-661eb04b3739',
  '1449844908441-8829872d2607', '1513584684374-8bab748fbf90', '1480074568708-e7b720bb3f09',
  '1430285561322-7808604715df', '1460317442991-0ec209397118', '1488462237308-ecaa28b729d7',
  '1494526585095-c41746248156', '1512918728675-ed5a9ecdebfd', '1536376072261-38c75010e6c9',
  '1464146072230-91cabc968266', '1560185009-8438151ecf60', '1570129477492-45c003edd2be'
];

async function seed() {
  try {
    console.log("Authenticating...");
    await signInWithEmailAndPassword(auth, "vishalratanshakya@gmail.com", "vishal123");
    console.log("Authenticated successfully!");
    
    let count = 0;
    
    for (const listingType of ['sell', 'rent']) {
      for (const pType of types) {
        for (let i = 0; i < 10; i++) {
          const imgId = baseImages[Math.floor(Math.random() * baseImages.length)];
          const mainImage = `https://images.unsplash.com/photo-${imgId}?w=800&q=80&rand=${count}`;
          
          const price = listingType === 'sell' 
            ? Math.floor(Math.random() * 50000000) + 5000000 
            : Math.floor(Math.random() * 150000) + 15000;

          const p = {
            title: `Premium ${pType} in Top Location ${i+1}`,
            propertyType: pType,
            type: pType,
            category: pType.toLowerCase(),
            listingType: listingType,
            furnishingStatus: i % 2 === 0 ? "Fully Furnished" : "Semi-Furnished",
            shortDescription: `A fantastic ${pType.toLowerCase()} available for ${listingType}.`,
            fullDescription: `This is a brilliantly designed ${pType.toLowerCase()} perfect for families or individuals looking for high-quality living spaces. Features excellent ventilation, great views, and premium amenities.`,
            bhkType: `${(i % 4) + 1} BHK`,
            bedrooms: (i % 4) + 1,
            bathrooms: (i % 3) + 1,
            price: price,
            pricing: {
              price: price,
              negotiable: true
            },
            mainImage: mainImage,
            images: [mainImage],
            location: { city: "Mumbai", locality: "Downtown" },
            amenities: ["Security", "Parking", "Gym"],
            vendorId: auth.currentUser.uid,
            vendorRole: "admin",
            vendorName: "Admin",
            status: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          await addDoc(collection(db, "properties"), p);
          count++;
          console.log(`Added ${listingType.toUpperCase()} ${pType} - ${count}/60`);
        }
      }
    }
    console.log("Seeding completely finished!");
    process.exit(0);
  } catch(e) {
    console.error("Error seeding:", e);
    process.exit(1);
  }
}

seed();
