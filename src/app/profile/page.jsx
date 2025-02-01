"use client"; // Mark this file as a client component

import React, { useState, useEffect } from "react";
import { auth } from "@/config/firebase"; // Firebase auth config
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Ensure correct import
import { sendPasswordResetEmail } from "firebase/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Import Avatar

const Profile = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state for button
  const [errorMessage, setErrorMessage] = useState(""); // Store error message
  const [successMessage, setSuccessMessage] = useState(""); // Store success message
  const router = useRouter();

  useEffect(() => {
    // Get the current user from Firebase Auth
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setEmail(currentUser.email); // Set the email of the current user
    } else {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, []);

  const handlePasswordReset = async () => {
    if (!email) return;

    setIsLoading(true); // Start loading when request is made
    setErrorMessage(""); // Reset error message
    setSuccessMessage(""); // Reset success message

    try {
      await sendPasswordResetEmail(auth, email); // Send reset password email
      setSuccessMessage("Password reset email sent successfully. Please check your inbox.");
      alert("Password reset link sent to your email!"); // Alert when reset link is sent
      setIsDialogOpen(false); // Close the dialog after success
    } catch (error) {
      setErrorMessage("Error sending password reset email: " + error.message);
    } finally {
      setIsLoading(false); // Stop loading after request is complete
    }
  };

  const isGoogleUser = user && user.providerData.some((provider) => provider.providerId === "google.com");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-3xl p-6 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-500">Profile</h1>
        {user ? (
          <div className="mb-6 text-lg">
            {/* Profile Image from public folder */}
            <div className="flex justify-center mb-6">
              <Avatar className="w-24 h-24 rounded-full border-4 border-blue-500">
                <AvatarImage src="/robotic.png" alt="Profile" /> {/* Direct image from public folder */}
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
            <p className="mb-2">Email: <span className="font-semibold text-blue-400">{user.email}</span></p>
            <p className="mb-4">User ID: <span className="font-semibold text-blue-400">{user.uid}</span></p>

            {/* Conditionally render the change password button */}
            {!isGoogleUser && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md shadow-md text-xl">
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 p-8 rounded-lg shadow-lg">
                  <DialogTitle className="text-3xl text-blue-500">Reset Your Password</DialogTitle>
                  <DialogDescription className="text-lg text-gray-400 mb-6">
                    Enter your email address to receive a password reset link.
                  </DialogDescription>
                  <Input
                    type="email"
                    placeholder="Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mb-6 p-4 bg-gray-700 text-white border border-blue-500 rounded-md w-full text-xl"
                  />
                  {/* Dialog actions */}
                  <div className="flex flex-col gap-4 mt-6">
                    {errorMessage && (
                      <p className="text-red-500 text-lg">{errorMessage}</p>
                    )}
                    {successMessage && (
                      <p className="text-green-500 text-lg">{successMessage}</p>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => setIsDialogOpen(false)}
                      className="bg-gray-600 text-white hover:bg-gray-700 py-3 px-6 rounded-md text-lg"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className={`${
                        isLoading ? "bg-gray-500" : "bg-blue-600"
                      } hover:bg-blue-700 text-white py-3 px-6 rounded-md text-lg`}
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Message for Google users */}
            {isGoogleUser && (
              <p className="mt-4 text-lg text-green-400">
                You signed in with Google.
              </p>
            )}
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
