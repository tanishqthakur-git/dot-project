"use client";

import { useState } from "react";
import { loginWithEmailAndPassword, loginWithGoogle } from "@/helpers/loginHelp"; // Path to Google Login function
import { useRouter } from "next/navigation";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const router =  useRouter();
  

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const user = await loginWithEmailAndPassword(email, password);
      console.log("Logged in as:", user.email);
      // Redirect to the dashboard or other page
      if(user) router.push("/dashboard");
    } catch (error) {
      setError(error.message); // Display error message to the user
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      console.log("Logged in with Google:", user.displayName);
      // Redirect to the dashboard or other page
      if(user) router.push("/dashboard");
    } catch (error) {
      setError(error.message); // Display error message to the user
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      
      <div className="mb-4">
        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg mb-4"
        >
          Login with Google
        </button>
      </div>
      
      <div className="mb-4">
        {/* Email Login */}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="px-4 py-2 mb-2 border rounded-lg w-64"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="px-4 py-2 mb-2 border rounded-lg w-64"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-lg w-64"
          >
            Login with Email
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
