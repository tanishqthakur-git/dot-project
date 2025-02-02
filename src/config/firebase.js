import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";  // ✅ Import Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfRE78M63UCUl5IfgNXnUgUiTpnfGbrnA",
  authDomain: "ai-code-6d461.firebaseapp.com",
  projectId: "ai-code-6d461",
  storageBucket: "ai-code-6d461.firebasestorage.app",
  messagingSenderId: "239747401831",
  appId: "1:239747401831:web:5052bd7dd20c8dd8b86cc2",
  measurementId: "G-MZEX9DPYGE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const firestore = getFirestore(app);
const rtdb = getDatabase(app);  // ✅ Initialize Realtime Database

// Set Auth Persistence
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Firebase Auth Persistence Set to Local"))
  .catch((error) => console.error("Firebase Auth Persistence Error:", error));

export { auth, db, rtdb, firestore };
export default app;