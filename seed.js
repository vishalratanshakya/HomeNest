import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

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

const sellProperties = [
  {
    title: "Modern Glass Villa in Beverly Hills",
    propertyType: "Villa",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Luxurious modern villa with infinity pool and panoramic city views.",
    fullDescription: "Experience unparalleled luxury in this modern architectural masterpiece. Floor-to-ceiling glass walls offer breathtaking views of the city skyline. Features include a zero-edge infinity pool, smart home automation, private home theater, and a climate-controlled wine cellar.",
    bhkType: "5 BHK",
    bedrooms: 5,
    bathrooms: 6,
    balconies: 3,
    floorNumber: 1,
    totalFloors: 2,
    propertyAge: "New Construction",
    constructionStatus: "Ready to Move",
    price: 85000000,
    mainImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
    location: { city: "Mumbai", state: "Maharashtra", locality: "Bandra West", fullAddress: "123 Beverly Road, Bandra West" },
    amenities: ["Swimming Pool", "Home Theater", "Smart Home", "Wine Cellar", "Gym"]
  },
  {
    title: "Sky High Penthouse with Private Terrace",
    propertyType: "Apartment",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Ultra-luxury penthouse spanning the entire top floor.",
    fullDescription: "A crown jewel in the sky. This penthouse offers 360-degree views, a private rooftop terrace with a jacuzzi, premium Italian marble flooring, and exclusive elevator access. Perfect for those who demand the absolute best in urban living.",
    bhkType: "4 BHK",
    bedrooms: 4,
    bathrooms: 5,
    balconies: 4,
    floorNumber: 40,
    totalFloors: 40,
    propertyAge: "1 Year",
    constructionStatus: "Ready to Move",
    price: 45000000,
    mainImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"],
    location: { city: "Mumbai", state: "Maharashtra", locality: "Worli", fullAddress: "Tower A, Worli Sea Face" },
    amenities: ["Private Terrace", "Jacuzzi", "Private Elevator", "Security"]
  },
  {
    title: "Contemporary Family Home in Quiet Suburb",
    propertyType: "House",
    furnishingStatus: "Unfurnished",
    shortDescription: "Spacious family home with a massive backyard and garden.",
    fullDescription: "Nestled in a peaceful, tree-lined neighborhood, this spacious home is perfect for growing families. It features an open-concept kitchen, a sunroom, a massive backyard perfect for kids and pets, and a two-car garage.",
    bhkType: "3 BHK",
    bedrooms: 3,
    bathrooms: 3,
    balconies: 1,
    floorNumber: 1,
    totalFloors: 2,
    propertyAge: "5 Years",
    constructionStatus: "Ready to Move",
    price: 15000000,
    mainImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
    location: { city: "Pune", state: "Maharashtra", locality: "Koregaon Park", fullAddress: "45 Green Lane, Koregaon Park" },
    amenities: ["Backyard", "Garage", "Garden", "Sunroom"]
  },
  {
    title: "Urban Smart Apartment near Metro",
    propertyType: "Apartment",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Compact, tech-enabled apartment in the heart of the business district.",
    fullDescription: "Designed for the modern professional. This apartment comes fully loaded with smart home tech (voice-controlled lights, smart locks, automated blinds). Just a 2-minute walk to the nearest metro station and surrounded by top cafes.",
    bhkType: "2 BHK",
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floorNumber: 15,
    totalFloors: 25,
    propertyAge: "New Construction",
    constructionStatus: "Ready to Move",
    price: 9500000,
    mainImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
    location: { city: "Bengaluru", state: "Karnataka", locality: "Indiranagar", fullAddress: "Smart Tower, Indiranagar" },
    amenities: ["Smart Home", "Metro Access", "Gym", "Coworking Space"]
  },
  {
    title: "Classic Colonial Style Mansion",
    propertyType: "Villa",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Historic charm meets modern luxury in this sprawling estate.",
    fullDescription: "A rare find! This colonial-style mansion has been fully renovated while preserving its historic charm. Features a grand staircase, vintage chandeliers, a sprawling lawn, a private library, and guest quarters.",
    bhkType: "6 BHK",
    bedrooms: 6,
    bathrooms: 7,
    balconies: 4,
    floorNumber: 1,
    totalFloors: 3,
    propertyAge: "10+ Years",
    constructionStatus: "Ready to Move",
    price: 120000000,
    mainImage: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    images: ["https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800"],
    location: { city: "Delhi", state: "Delhi", locality: "Lutyens", fullAddress: "Heritage Avenue, Lutyens Delhi" },
    amenities: ["Library", "Guest Quarters", "Grand Lawn", "Security"]
  },
  {
    title: "Sea-Facing Luxury Condo",
    propertyType: "Apartment",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Wake up to the sound of the ocean in this premium condo.",
    fullDescription: "Direct ocean views from every room. This condo features a wrap-around balcony, beach access, an Olympic-sized community pool, and premium club house amenities. The interiors are styled with contemporary coastal decor.",
    bhkType: "3 BHK",
    bedrooms: 3,
    bathrooms: 3,
    balconies: 2,
    floorNumber: 22,
    totalFloors: 35,
    propertyAge: "2 Years",
    constructionStatus: "Ready to Move",
    price: 35000000,
    mainImage: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
    images: ["https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800"],
    location: { city: "Mumbai", state: "Maharashtra", locality: "Juhu", fullAddress: "Oceanic Tower, Juhu Tara Road" },
    amenities: ["Sea View", "Beach Access", "Pool", "Club House"]
  },
  {
    title: "Eco-Friendly Green Villa",
    propertyType: "Villa",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Sustainable living with solar panels and rainwater harvesting.",
    fullDescription: "Completely off-grid capable! This villa features advanced solar panels, rainwater harvesting, an organic vegetable garden, and natural cross-ventilation design. Perfect for the environmentally conscious buyer.",
    bhkType: "4 BHK",
    bedrooms: 4,
    bathrooms: 4,
    balconies: 2,
    floorNumber: 1,
    totalFloors: 2,
    propertyAge: "New Construction",
    constructionStatus: "Ready to Move",
    price: 28000000,
    mainImage: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
    images: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800"],
    location: { city: "Bengaluru", state: "Karnataka", locality: "Whitefield", fullAddress: "Eco Village, Whitefield" },
    amenities: ["Solar Power", "Rainwater Harvesting", "Organic Garden", "Security"]
  },
  {
    title: "High-Rise Studio for Investors",
    propertyType: "Apartment",
    furnishingStatus: "Fully Furnished",
    shortDescription: "High ROI studio apartment in a booming IT corridor.",
    fullDescription: "An excellent investment opportunity. This fully furnished studio apartment is located right next to major tech parks, ensuring high rental yield. Features space-saving furniture, a modular kitchenette, and community gym.",
    bhkType: "1 BHK",
    bedrooms: 1,
    bathrooms: 1,
    balconies: 1,
    floorNumber: 10,
    totalFloors: 15,
    propertyAge: "Under Construction",
    constructionStatus: "Under Construction",
    price: 4500000,
    mainImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
    location: { city: "Hyderabad", state: "Telangana", locality: "HITEC City", fullAddress: "Tech Hub Tower, HITEC City" },
    amenities: ["Gym", "Coworking Space", "Security", "Parking"]
  },
  {
    title: "Lakeside Tranquil Retreat",
    propertyType: "House",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Peaceful independent house overlooking a serene lake.",
    fullDescription: "Escape the city noise. This house offers stunning lake views, a private deck for fishing or relaxing, large bay windows, and a cozy fireplace for winter nights. A perfect holiday home or retirement retreat.",
    bhkType: "3 BHK",
    bedrooms: 3,
    bathrooms: 2,
    balconies: 2,
    floorNumber: 1,
    totalFloors: 1,
    propertyAge: "8 Years",
    constructionStatus: "Ready to Move",
    price: 18000000,
    mainImage: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
    images: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800"],
    location: { city: "Udaipur", state: "Rajasthan", locality: "Fateh Sagar", fullAddress: "Lakeview Drive, Udaipur" },
    amenities: ["Lake View", "Private Deck", "Fireplace", "Garden"]
  },
  {
    title: "Premium Golf Course Facing Villa",
    propertyType: "Villa",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Ultra-premium villa right on the 18th hole.",
    fullDescription: "For the golf enthusiast. Wake up and walk straight onto the green. This villa includes exclusive club membership, a private putting green in the backyard, imported fixtures, and dedicated golf cart parking.",
    bhkType: "5 BHK",
    bedrooms: 5,
    bathrooms: 6,
    balconies: 3,
    floorNumber: 1,
    totalFloors: 2,
    propertyAge: "3 Years",
    constructionStatus: "Ready to Move",
    price: 65000000,
    mainImage: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"],
    location: { city: "Gurugram", state: "Haryana", locality: "DLF Phase 5", fullAddress: "Golf Links, DLF Phase 5" },
    amenities: ["Golf Course View", "Club Membership", "Private Pool", "Security"]
  }
];

const rentProperties = [
  {
    title: "Cozy Downtown Loft",
    propertyType: "Apartment",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Exposed brick walls and high ceilings in the city center.",
    fullDescription: "A stylish NYC-style loft right in the downtown area. Features exposed brick walls, 15-foot ceilings, industrial lighting, and a modern open kitchen. Walking distance to all major offices and nightlife.",
    bhkType: "1 BHK",
    bedrooms: 1,
    bathrooms: 1,
    balconies: 0,
    floorNumber: 3,
    totalFloors: 5,
    propertyAge: "Old Construction",
    constructionStatus: "Ready to Move",
    price: 45000,
    mainImage: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
    location: { city: "Bengaluru", state: "Karnataka", locality: "MG Road", fullAddress: "Heritage Lofts, MG Road" },
    amenities: ["Central AC", "Gym", "Security"]
  },
  {
    title: "Spacious Family Apartment with Pool View",
    propertyType: "Apartment",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Perfect for families, overlooking the central pool.",
    fullDescription: "A massive 3BHK apartment in a premium gated community. Features built-in wardrobes, modular kitchen, and a large balcony overlooking the central swimming pool. The community has a park, tennis court, and supermarket.",
    bhkType: "3 BHK",
    bedrooms: 3,
    bathrooms: 3,
    balconies: 2,
    floorNumber: 8,
    totalFloors: 12,
    propertyAge: "2 Years",
    constructionStatus: "Ready to Move",
    price: 65000,
    mainImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800",
    images: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800"],
    location: { city: "Mumbai", state: "Maharashtra", locality: "Andheri West", fullAddress: "Sunshine Towers, Andheri West" },
    amenities: ["Swimming Pool", "Tennis Court", "Park", "Supermarket"]
  },
  {
    title: "Luxury Serviced Apartment",
    propertyType: "Apartment",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Hotel-like luxury with daily housekeeping.",
    fullDescription: "Experience 5-star living. This serviced apartment includes daily housekeeping, high-speed Wi-Fi, premium linen, fully equipped kitchen, and 24/7 concierge service. Perfect for expats and corporate executives.",
    bhkType: "2 BHK",
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floorNumber: 5,
    totalFloors: 10,
    propertyAge: "New Construction",
    constructionStatus: "Ready to Move",
    price: 85000,
    mainImage: "https://images.unsplash.com/photo-1502672260266-1c1de2d9d000?w=800",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1de2d9d000?w=800"],
    location: { city: "Pune", state: "Maharashtra", locality: "Viman Nagar", fullAddress: "Executive Suites, Viman Nagar" },
    amenities: ["Housekeeping", "Concierge", "Wi-Fi", "Gym"]
  },
  {
    title: "Budget-Friendly Student Housing",
    propertyType: "Apartment",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Affordable and close to major universities.",
    fullDescription: "A great option for students or bachelors. This clean and simple apartment is located just minutes away from the university campus. Includes basic furnishings, study tables, and high-speed internet setup.",
    bhkType: "2 BHK",
    bedrooms: 2,
    bathrooms: 1,
    balconies: 1,
    floorNumber: 2,
    totalFloors: 4,
    propertyAge: "5 Years",
    constructionStatus: "Ready to Move",
    price: 22000,
    mainImage: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800",
    images: ["https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800"],
    location: { city: "Delhi", state: "Delhi", locality: "North Campus", fullAddress: "Student Avenue, North Campus" },
    amenities: ["Internet Ready", "Study Room", "Security"]
  },
  {
    title: "Independent Floor in Quiet Neighborhood",
    propertyType: "House",
    furnishingStatus: "Unfurnished",
    shortDescription: "Entire first floor of a bungalow with private entrance.",
    fullDescription: "Enjoy privacy and space. This independent floor comes with a private entrance, a large terrace, marble flooring, and ample street parking. Perfect for a family looking for a long-term lease.",
    bhkType: "3 BHK",
    bedrooms: 3,
    bathrooms: 2,
    balconies: 2,
    floorNumber: 1,
    totalFloors: 2,
    propertyAge: "10+ Years",
    constructionStatus: "Ready to Move",
    price: 35000,
    mainImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800",
    images: ["https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800"],
    location: { city: "Chennai", state: "Tamil Nadu", locality: "Anna Nagar", fullAddress: "Block T, Anna Nagar" },
    amenities: ["Private Terrace", "Parking", "Water Supply"]
  },
  {
    title: "Pet-Friendly Garden Villa",
    propertyType: "Villa",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Spacious villa with a fenced yard, perfect for pets.",
    fullDescription: "Your furry friends will love this place! A beautiful 4BHK villa featuring a large, securely fenced garden, pet washing station, and easy-to-clean tile flooring on the ground floor. Located near a large dog park.",
    bhkType: "4 BHK",
    bedrooms: 4,
    bathrooms: 4,
    balconies: 2,
    floorNumber: 1,
    totalFloors: 2,
    propertyAge: "3 Years",
    constructionStatus: "Ready to Move",
    price: 120000,
    mainImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    images: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"],
    location: { city: "Bengaluru", state: "Karnataka", locality: "Koramangala", fullAddress: "Green Enclave, Koramangala" },
    amenities: ["Pet Friendly", "Garden", "Security", "Clubhouse"]
  },
  {
    title: "Minimalist Modern Apartment",
    propertyType: "Apartment",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Clean lines and minimalist decor for the focused mind.",
    fullDescription: "Designed with a minimalist aesthetic, this apartment offers a clutter-free living experience. Features concealed storage, sleek Japanese-inspired furniture, neutral color palettes, and abundant natural light.",
    bhkType: "2 BHK",
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floorNumber: 6,
    totalFloors: 10,
    propertyAge: "1 Year",
    constructionStatus: "Ready to Move",
    price: 55000,
    mainImage: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800",
    images: ["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800"],
    location: { city: "Hyderabad", state: "Telangana", locality: "Gachibowli", fullAddress: "Zen Heights, Gachibowli" },
    amenities: ["Gym", "Pool", "Smart Lock"]
  },
  {
    title: "Historic Art Deco Flat",
    propertyType: "Apartment",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Live in a piece of history with modern upgrades.",
    fullDescription: "Located in a heritage building, this Art Deco flat features original terrazzo flooring, high ceilings, large arched windows, and a recently renovated modern kitchen and bathrooms. A true architectural gem.",
    bhkType: "2 BHK",
    bedrooms: 2,
    bathrooms: 2,
    balconies: 1,
    floorNumber: 2,
    totalFloors: 4,
    propertyAge: "50+ Years",
    constructionStatus: "Ready to Move",
    price: 90000,
    mainImage: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800",
    images: ["https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=800"],
    location: { city: "Mumbai", state: "Maharashtra", locality: "Colaba", fullAddress: "Art Deco Mansion, Colaba" },
    amenities: ["Heritage Building", "Security", "Sea View"]
  },
  {
    title: "Fully Equipped Co-Living Space",
    propertyType: "Apartment",
    furnishingStatus: "Fully Furnished",
    shortDescription: "Rent a private room in a luxury co-living apartment.",
    fullDescription: "Perfect for young professionals. Rent a private en-suite bedroom in this massive co-living space. Shared amenities include a professional kitchen, a massive lounge area with a PS5, a mini-theatre, and a coworking space.",
    bhkType: "1 BHK",
    bedrooms: 1,
    bathrooms: 1,
    balconies: 0,
    floorNumber: 4,
    totalFloors: 8,
    propertyAge: "New Construction",
    constructionStatus: "Ready to Move",
    price: 25000,
    mainImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
    location: { city: "Pune", state: "Maharashtra", locality: "Hinjewadi", fullAddress: "CoLive Tower, Hinjewadi" },
    amenities: ["Coworking Space", "Lounge", "Mini Theatre", "Cleaning Service"]
  },
  {
    title: "Expansive Farmhouse on the Outskirts",
    propertyType: "House",
    furnishingStatus: "Semi-Furnished",
    shortDescription: "Massive property with a private pool and mango orchard.",
    fullDescription: "Experience ultimate luxury and space. This farmhouse sits on 2 acres of land, featuring a private swimming pool, a mango orchard, a bonfire pit, and a massive wrap-around porch. Ideal for weekend getaways or peaceful long-term living.",
    bhkType: "5 BHK",
    bedrooms: 5,
    bathrooms: 5,
    balconies: 4,
    floorNumber: 1,
    totalFloors: 2,
    propertyAge: "5 Years",
    constructionStatus: "Ready to Move",
    price: 150000,
    mainImage: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800",
    images: ["https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800"],
    location: { city: "Delhi", state: "Delhi", locality: "Chattarpur", fullAddress: "Farm No. 42, Chattarpur Farms" },
    amenities: ["Private Pool", "Orchard", "Bonfire Pit", "Security Staff"]
  }
];

async function seed() {
  let count = 0;
  for (const p of sellProperties) {
    p.category = "sell";
    p.listingType = "sell";
    p.vendorId = "admin";
    p.vendorRole = "admin";
    p.vendorName = "Admin";
    p.status = "active";
    p.createdAt = serverTimestamp();
    p.updatedAt = serverTimestamp();
    await addDoc(collection(db, "properties"), p);
    count++;
    console.log(`Added Sell property ${count}`);
  }
  
  for (const p of rentProperties) {
    p.category = "rent";
    p.listingType = "rent";
    p.vendorId = "admin";
    p.vendorRole = "admin";
    p.vendorName = "Admin";
    p.status = "active";
    p.createdAt = serverTimestamp();
    p.updatedAt = serverTimestamp();
    await addDoc(collection(db, "properties"), p);
    count++;
    console.log(`Added Rent property ${count}`);
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(console.error);
