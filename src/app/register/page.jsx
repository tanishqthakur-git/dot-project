"use client";
import { useState } from "react";
import { signUpUser, signInWithGoogle } from "@/helpers/signUpHelp";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async () => {
    const res = await signUpUser(email, password, displayName);
    if (!res.success) setError(res.error);
    console.log("costum user created", res);
  };

  return (
    <div>
      <h1>Sign Up</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input type="text" placeholder="Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleSignUp}>Sign Up</button>
      <button onClick={signInWithGoogle}>Sign Up with Google</button>
    </div>
  );
}
