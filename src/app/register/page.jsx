"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle Email Sign Up
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("All fields are required");
    
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created successfully!");
      router.push("/dashboard"); // Redirect to dashboard
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success("Signed in with Google!");
      router.push("/dashboard"); // Redirect to dashboard
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-[350px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-center">Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-500">Or sign up with</p>
            <Button variant="outline" className="w-full mt-2" onClick={handleGoogleSignIn} disabled={loading}>
              Sign in with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
