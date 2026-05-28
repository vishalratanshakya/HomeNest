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

const categories = ['Apartment', 'Villa', 'House', 'Commercial', 'Land', 'Studio'];

const categoryDetails = {
  Apartment: {
    tag: 'apartment',
    shortDesc: 'A beautiful modern apartment with panoramic city views and premium features.',
    fullDesc: 'Enjoy luxury living in this spacious apartment. Features include floor-to-ceiling windows, high-end modular kitchen appliances, and central air conditioning. Located in a secure gated community with 24/7 security, a swimming pool, and a fully equipped gymnasium.',
    amenities: ["Security", "Parking", "Gym", "Swimming Pool", "CCTV", "Power Backup"]
  },
  Villa: {
    tag: 'villa',
    shortDesc: 'A magnificent villa featuring private gardens, an infinity pool, and premium finishes.',
    fullDesc: 'This stunning villa offers unmatched space and comfort. The open floor plan includes multiple living areas, a home theater, a private elevator, and a chef\'s kitchen. The landscaped backyard has a large deck, barbecue area, and a beautiful swimming pool. Perfect for upscale luxury living.',
    amenities: ["Swimming Pool", "Garden", "Garage", "Home Theater", "Smart Home", "Security"]
  },
  House: {
    tag: 'house',
    shortDesc: 'A beautiful independent house with a large backyard and private parking.',
    fullDesc: 'Perfect home for a growing family. This independent house features a large front garden, spacious bedrooms with attached bathrooms, and a fully modular kitchen. Situated in a peaceful neighborhood close to top schools, parks, and shopping centers.',
    amenities: ["Garden", "Backyard", "Garage", "Security", "Water Supply", "Pet Friendly"]
  },
  Commercial: {
    tag: 'commercial',
    shortDesc: 'A prime commercial space ideal for offices, retail stores, or startups.',
    fullDesc: 'Excellent commercial property located in a busy business district. Features a spacious layout, high-speed elevator access, central air conditioning, fire alarm safety, and ample visitor parking. Perfect setting to establish or grow your business with great visibility.',
    amenities: ["Security", "Elevator", "Parking", "Conference Room", "Power Backup", "Fire Safety"]
  },
  Land: {
    tag: 'land',
    shortDesc: 'A strategically located plot of land ready for immediate development.',
    fullDesc: 'A great investment opportunity. This clear-title plot is situated in a rapidly developing area. Suitable for constructing a custom villa, residential apartments, or commercial warehouse. Fully demarcated with access to electricity, water, and wide roads.',
    amenities: ["Water Supply", "Road Access", "Fencing", "Electricity Link"]
  },
  Studio: {
    tag: 'studio',
    shortDesc: 'A compact, highly efficient studio apartment designed for modern professionals.',
    fullDesc: 'Smart living at its finest. This studio apartment maximizes space with built-in storage, a modern kitchenette, and stylish premium furnishings. Ideally located near public transit hubs, popular dining areas, and cultural centers. Low maintenance and perfect for single occupancy.',
    amenities: ["Security", "Parking", "CCTV", "Metro Access", "High-speed Internet"]
  }
};

const locations = [
  { city: "Mumbai", state: "Maharashtra", locality: "Bandra West", address: "Carter Road", fullAddress: "Carter Road, Bandra West, Mumbai, Maharashtra" },
  { city: "Mumbai", state: "Maharashtra", locality: "Worli", address: "Worli Sea Face", fullAddress: "Worli Sea Face, Worli, Mumbai, Maharashtra" },
  { city: "Pune", state: "Maharashtra", locality: "Koregaon Park", address: "North Main Road", fullAddress: "Lane 5, Koregaon Park, Pune, Maharashtra" },
  { city: "Bengaluru", state: "Karnataka", locality: "Indiranagar", address: "100 Feet Road", fullAddress: "100 Feet Road, Indiranagar, Bengaluru, Karnataka" },
  { city: "Bengaluru", state: "Karnataka", locality: "Whitefield", address: "ITPL Main Road", fullAddress: "ITPL Main Road, Whitefield, Bengaluru, Karnataka" },
  { city: "Delhi", state: "Delhi", locality: "Vasant Vihar", address: "Poorvi Marg", fullAddress: "Poorvi Marg, Vasant Vihar, New Delhi, Delhi" },
  { city: "Delhi", state: "Delhi", locality: "Connaught Place", address: "Outer Circle", fullAddress: "Outer Circle, Connaught Place, New Delhi, Delhi" },
  { city: "Gurugram", state: "Haryana", locality: "DLF Phase 3", address: "Golf Course Road", fullAddress: "Golf Course Road, DLF Phase 3, Gurugram, Haryana" },
  { city: "Hyderabad", state: "Telangana", locality: "Jubilee Hills", address: "Road No. 36", fullAddress: "Road No. 36, Jubilee Hills, Hyderabad, Telangana" },
  { city: "Chennai", state: "Tamil Nadu", locality: "Adyar", address: "Gandhi Nagar", fullAddress: "Gandhi Nagar, Adyar, Chennai, Tamil Nadu" }
];

async function seed() {
  try {
    console.log("Authenticating as Admin...");
    await signInWithEmailAndPassword(auth, "vishalratanshakya@gmail.com", "vishal123");
    console.log("Authenticated successfully!");

    let count = 0;

    for (const listingType of ['sell', 'rent']) {
      for (const category of categories) {
        const details = categoryDetails[category];
        const tag = details.tag;

        for (let i = 1; i <= 10; i++) {
          count++; // Unique ID index (1 to 120)
          
          // Image generation: guarantee 100% uniqueness via lock IDs
          const mainImage = `https://loremflickr.com/800/600/${tag}?lock=${count * 10}`;
          
          let subImg1, subImg2, subImg3;
          if (tag === 'land') {
            subImg1 = `https://loremflickr.com/800/600/landscape?lock=${count * 10 + 1}`;
            subImg2 = `https://loremflickr.com/800/600/nature?lock=${count * 10 + 2}`;
            subImg3 = `https://loremflickr.com/800/600/field?lock=${count * 10 + 3}`;
          } else if (tag === 'commercial') {
            subImg1 = `https://loremflickr.com/800/600/office?lock=${count * 10 + 1}`;
            subImg2 = `https://loremflickr.com/800/600/workspace?lock=${count * 10 + 2}`;
            subImg3 = `https://loremflickr.com/800/600/architecture?lock=${count * 10 + 3}`;
          } else {
            subImg1 = `https://loremflickr.com/800/600/${tag},interior?lock=${count * 10 + 1}`;
            subImg2 = `https://loremflickr.com/800/600/${tag},kitchen?lock=${count * 10 + 2}`;
            subImg3 = `https://loremflickr.com/800/600/${tag},bedroom?lock=${count * 10 + 3}`;
          }

          const images = [mainImage, subImg1, subImg2, subImg3];

          // Price Calculation
          let price = 0;
          if (listingType === 'sell') {
            if (category === 'Apartment') price = 50000000 + i * 10000000;
            else if (category === 'Villa') price = 120000000 + i * 30000000;
            else if (category === 'House') price = 60000000 + i * 12000000;
            else if (category === 'Commercial') price = 150000000 + i * 50000000;
            else if (category === 'Land') price = 20000000 + i * 8000000;
            else if (category === 'Studio') price = 15000000 + i * 2000000;
          } else {
            if (category === 'Apartment') price = 25000 + i * 8000;
            else if (category === 'Villa') price = 120000 + i * 35000;
            else if (category === 'House') price = 40000 + i * 12000;
            else if (category === 'Commercial') price = 80000 + i * 80000;
            else if (category === 'Land') price = 10000 + i * 4000;
            else if (category === 'Studio') price = 12000 + i * 3000;
          }

          // Furnishing status distribution
          let furnishVal = "Semi-Furnished";
          if (category === 'Land') furnishVal = "Unfurnished";
          else if (category === 'Commercial') furnishVal = "Unfurnished";
          else {
            if (i % 3 === 0) furnishVal = "Fully Furnished";
            else if (i % 3 === 2) furnishVal = "Unfurnished";
          }

          // BHK and bedrooms/bathrooms
          const isStructure = (category !== 'Land' && category !== 'Commercial');
          const bedrooms = isStructure ? ((i % 4) + 1) : 0;
          const bathrooms = isStructure ? ((i % 3) + 1) : 0;
          const balconies = isStructure ? (i % 3) : 0;
          const bhk = bedrooms;
          const bhkType = isStructure ? `${bedrooms} BHK` : "N/A";

          // Area calculation
          let area = 1000;
          if (category === 'Apartment') area = 900 + i * 150;
          else if (category === 'Villa') area = 2500 + i * 500;
          else if (category === 'House') area = 1800 + i * 300;
          else if (category === 'Commercial') area = 1500 + i * 800;
          else if (category === 'Land') area = 1200 + i * 400;
          else if (category === 'Studio') area = 400 + i * 50;

          // Select one of the 10 locations uniformly using (i - 1)
          const location = locations[i - 1];

          const p = {
            title: `Premium ${category} in ${location.locality} ${i}`,
            propertyType: category,
            type: category,
            category: tag,
            listingType: listingType,
            furnishing: furnishVal,
            furnishingStatus: furnishVal,
            shortDescription: details.shortDesc,
            fullDescription: details.fullDesc,
            description: details.fullDesc,
            bhkType: bhkType,
            bhk: bhk,
            bedrooms: bedrooms,
            bathrooms: bathrooms,
            balcony: balconies,
            balconies: balconies,
            area: `${area} sqft`,
            price: price,
            pricing: {
              price: price,
              negotiable: true
            },
            mainImage: mainImage,
            images: images,
            subImages: [subImg1, subImg2, subImg3],
            location: location,
            amenities: details.amenities,
            vendorId: auth.currentUser.uid,
            vendorRole: "admin",
            vendorName: "Admin",
            vendorPhone: "+91 9988776655",
            vendorEmail: "vishalratanshakya@gmail.com",
            status: "active",
            rating: parseFloat((4.0 + (i % 10) * 0.1).toFixed(1)),
            reviews: 5 + (i * 3),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await addDoc(collection(db, "properties"), p);
          console.log(`Added ${listingType.toUpperCase()} ${category} - ${count}/120`);
        }
      }
    }

    console.log("Seeding completed successfully! Added 120 unique properties.");
    process.exit(0);
  } catch (e) {
    console.error("Error during seeding:", e);
    process.exit(1);
  }
}

seed();
