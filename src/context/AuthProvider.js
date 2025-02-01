"use client"; // If using Next.js 13+

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation"; 
import { auth } from "@/config/firebase"; 

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user); // Restore user session
      } else {
        setUser(null);
        // Redirect to login if on a protected route
        if (router.pathname.startsWith("/dashboard") || router.pathname.startsWith("/workspace")) {
          router.push("/login");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [router]);

  if (loading) return <div>Loading...</div>; // Prevent flickering

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
}
