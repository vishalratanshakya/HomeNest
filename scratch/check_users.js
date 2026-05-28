import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

async function check() {
  try {
    console.log("Authenticating...");
    await signInWithEmailAndPassword(auth, "vishalratanshakya@gmail.com", "vishal123");
    console.log("Authenticated!");

    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach(doc => {
      console.log(`User ID: ${doc.id}, Role: ${doc.data().role}, Email: ${doc.data().email}, Name: ${doc.data().name}`);
    });
    
    process.exit(0);
  } catch (e) {
    console.error("Auth error:", e);
    process.exit(1);
  }
}

check();
