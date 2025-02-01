import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore} from "firebase/firestore";
import 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0Wjx0LAR2E5lt9f_Tc9Ey-zmfZFyDsPI",
  authDomain: "ai-code-editor.firebaseapp.com",
  projectId: "ai-code-editor",
  storageBucket: "ai-code-editor.firebasestorage.app",
  messagingSenderId: "926023789287",
  appId: "1:926023789287:web:68797a53e70a2893c11042"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase Auth Persistence Set to Local");
  })
  .catch((error) => {
    console.error("Firebase Auth Persistence Error:", error);
  });

export { auth, db };


export default app;