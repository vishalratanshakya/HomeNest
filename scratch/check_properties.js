import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvQnNvQwERE7AlURpbJhK3KL-Y8Qo6WPU",
  authDomain: "realstate-8bceb.firebaseapp.com",
  projectId: "realstate-8bceb",
  storageBucket: "realstate-8bceb.firebasestorage.app",
  messagingSenderId: "337506724975",
  appId: "1:337506724975:web:870c1d2311a2e72d69b19a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkProperties() {
  try {
    const querySnapshot = await getDocs(collection(db, "properties"));
    console.log("Total properties:", querySnapshot.size);
    querySnapshot.forEach((doc) => {
      console.log("ID:", doc.id, "Data:", JSON.stringify(doc.data(), null, 2));
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
  }
}

checkProperties();
