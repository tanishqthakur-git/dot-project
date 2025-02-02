import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore} from "firebase/firestore";
import 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMmc6y1d_RXhpUviWMaF4Grs25lki0-NE",
  authDomain: "ai-code-editor-846c4.firebaseapp.com",
  projectId: "ai-code-editor-846c4",
  storageBucket: "ai-code-editor-846c4.firebasestorage.app",
  messagingSenderId: "366858665230",
  appId: "1:366858665230:web:98ea6919a4bf7e8bb82b5f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const firestore = getFirestore(app);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth Persistence Set to Local");
  })
  .catch((error) => {
    console.error("Firebase Auth Persistence Error:", error);
  });

export { auth, db , firestore };


export default app;