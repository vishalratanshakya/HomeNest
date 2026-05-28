import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
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

async function purge() {
  try {
    console.log("Authenticating...");
    await signInWithEmailAndPassword(auth, "vishalratanshakya@gmail.com", "vishal123");
    console.log("Authenticated!");

    // Purge properties
    console.log("Fetching properties...");
    const propertiesSnapshot = await getDocs(collection(db, "properties"));
    console.log(`Found ${propertiesSnapshot.size} properties to delete.`);
    
    let deletedProps = 0;
    for (const d of propertiesSnapshot.docs) {
      await deleteDoc(doc(db, "properties", d.id));
      deletedProps++;
      if (deletedProps % 20 === 0) {
        console.log(`Deleted ${deletedProps}/${propertiesSnapshot.size} properties...`);
      }
    }
    console.log("Properties purge completed.");

    // Purge bookings
    console.log("Fetching bookings...");
    const bookingsSnapshot = await getDocs(collection(db, "bookings"));
    console.log(`Found ${bookingsSnapshot.size} bookings to delete.`);
    
    let deletedBookings = 0;
    for (const d of bookingsSnapshot.docs) {
      await deleteDoc(doc(db, "bookings", d.id));
      deletedBookings++;
    }
    console.log("Bookings purge completed.");
    
    process.exit(0);
  } catch (e) {
    console.error("Purge error:", e);
    process.exit(1);
  }
}

purge();
