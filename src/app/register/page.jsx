"use client";
import { useState } from "react";
import { signUpUser, signInWithGoogle } from "@/helpers/signUpHelp";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    const res = await signUpUser(email, password, displayName);
    if (!res.success) {
      setError("Sign-up failed");
      alert("Sign-up failed"); // Alert on sign-up failure
    } else {
      console.log("Custom user created", res);
      window.location.href = "/dashboard";
    }
  };

  const handleSignInWithGoogle = async () => {
    const res = await signInWithGoogle();
    if (!res.success) {
      setError("Google sign-in failed ");
      alert("Google sign-in failed " ); // Alert on Google sign-up failure
    } else {
      console.log("Google sign-in", res);
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
      <Card className="w-96 bg-[#1e293b] border border-gray-500 shadow-2xl rounded-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-white">Sign Up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <Input
            type="text"
            placeholder="Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-white text-black border border-gray-300"
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white text-black border border-gray-300"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-white text-black border border-gray-300"
          />
          <Button
            onClick={handleSignUp}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            Sign Up
          </Button>
          <Button
            onClick={handleSignInWithGoogle}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
          >
            Sign Up with Google
          </Button>
          <p className="text-center text-sm text-gray-300">
            Already registered?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
