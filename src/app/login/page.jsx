"use client";

import { useState } from "react";
import { loginWithEmailAndPassword, loginWithGoogle } from "@/helpers/loginHelp";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Custom Dark Theme for Toast
const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginWithEmailAndPassword(email, password);
      console.log("Logged in as:", user.email);

      if (user) {
        toast.success("Login successful!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      setError(error.message);
      toast.error("Login failed: " + error.message, toastOptions);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      console.log("Logged in with Google:", user.displayName);

      if (user) {
        toast.success("Logged in with Google!", toastOptions);
        router.push("/dashboard");
      }
    } catch (error) {
      setError(error.message);
      toast.error("Google login failed: " + error.message, toastOptions);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#0f172a] text-white">
      {/* Dark-themed Toast Container */}
      <ToastContainer theme="dark" />
      
      <Card className="w-96 bg-[#1e293b] border border-gray-500 shadow-2xl rounded-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold text-white">Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white text-black border border-gray-300" required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white text-black border border-gray-300" required />
            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold">
              Login with Email
            </Button>
          </form>
          <Button onClick={handleGoogleLogin} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold">
            Login with Google
          </Button>
          <p className="text-center text-sm text-gray-300">
            Don't have an account? <Link href="/register" className="text-blue-400 hover:text-blue-500 hover:underline">Sign Up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
