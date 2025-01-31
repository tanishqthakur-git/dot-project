import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
// Function to log in with Email and Password
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Logged in with email:", user.email);
    return user;
  } catch (error) {
    console.error("Error logging in with email:", error.message);
    throw new Error("Invalid credentials or user does not exist.");
  }
};

// Function to log in with Google
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Logged in with Google:", user.displayName);
    return user;
  } catch (error) {
    console.error("Error logging in with Google:", error.message);
    throw new Error("Google login failed.");
  }
};
