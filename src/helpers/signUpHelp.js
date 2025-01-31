import { auth, db } from "@/config/firebase"; 
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export const signUpUser = async (email, password, displayName) => {
  try {
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("user created",user);

    // Update profile with display name
    await updateProfile(user, { displayName });

    // Save user details in Firestore
    const userRef = doc(db, "users", user.uid);
    const docSnap = await setDoc(userRef, {
      email: user.email,
      displayName: displayName || "Anonymous",
      photoURL: user.photoURL || "",
      authProvider: "email",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      twoFactorEnabled: false,
      workspaces: {}, // Empty initially, user will join workspaces later
      settings: {
        theme: "dark",
        fontSize: 14,
        showLineNumbers: true,
        aiSuggestions: true, // Default AI setting
      },
      snippets: [],
    });

    console.log("user details saved", docSnap);

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
  
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          authProvider: "google",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          twoFactorEnabled: false,
          workspaces: {},
          settings: {
            theme: "dark",
            fontSize: 14,
            showLineNumbers: true,
            aiSuggestions: true,
          },
          snippets: [],
          activityLog: [],
        });
      }
  
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
