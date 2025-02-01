"use client"; // Mark this file as a client component

import React, { useState, useEffect } from "react";
import { auth, db } from "@/config/firebase"; // Firebase config
import { useRouter } from "next/navigation";
import { collection, doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [invites, setInvites] = useState([]); // Store invitations
  const router = useRouter();

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser(currentUser);
      setEmail(currentUser.email);
      fetchInvites(currentUser.uid);
    } else {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, []);

  const fetchInvites = async (userId) => {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setInvites(userSnap.data().invites || []);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent successfully. Please check your inbox.");
      alert("Password reset link sent to your email!");
      setIsDialogOpen(false);
    } catch (error) {
      setErrorMessage("Error sending password reset email: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (workspaceId) => {
    if (!user) return;

    try {
      // Step 1: Add user to the workspace as a contributor
      const membersRef = collection(db, `workspaces/${workspaceId}/members`);
      await setDoc(doc(membersRef, user.uid), {
        userId: user.uid,
        role: "contributor",
      });

      // Step 2: Remove the invite from the user's document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      // Update UI
      setInvites(invites.filter((id) => id !== workspaceId));
      alert("You have joined the workspace as a contributor!");
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleDeleteInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      // Update UI
      setInvites(invites.filter((id) => id !== workspaceId));
      alert("Invite deleted successfully.");
    } catch (error) {
      console.error("Error deleting invite:", error);
    }
  };

  const isGoogleUser = user && user.providerData.some((provider) => provider.providerId === "google.com");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-3xl p-6 bg-gray-800 rounded-lg shadow-xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-500">Profile</h1>
        {user ? (
          <div className="mb-6 text-lg">
            {/* Profile Image */}
            <div className="flex justify-center mb-6">
              <Avatar className="w-24 h-24 rounded-full border-4 border-blue-500">
                <AvatarImage src="/robotic.png" alt="Profile" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
            <p className="mb-2">Name: <span className="font-semibold text-blue-400">{user.displayName}</span></p>
            <p className="mb-2">Email: <span className="font-semibold text-blue-400">{user.email}</span></p>
            <p className="mb-4">User ID: <span className="font-semibold text-blue-400">{user.uid}</span></p>

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
                  <div className="flex flex-col gap-4 mt-6">
                    {errorMessage && <p className="text-red-500 text-lg">{errorMessage}</p>}
                    {successMessage && <p className="text-green-500 text-lg">{successMessage}</p>}
                    <Button variant="secondary" onClick={() => setIsDialogOpen(false)} className="bg-gray-600 text-white hover:bg-gray-700 py-3 px-6 rounded-md text-lg">
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className={`${isLoading ? "bg-gray-500" : "bg-blue-600"} hover:bg-blue-700 text-white py-3 px-6 rounded-md text-lg`}
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {isGoogleUser && <p className="mt-4 text-lg text-green-400">You signed in with Google.</p>}

            {/* Invitations Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Pending Invitations</h2>
              {invites.length > 0 ? (
                invites.map((workspaceId) => (
                  <div key={workspaceId} className="bg-gray-700 p-4 rounded-md flex justify-between items-center mb-2">
                    <span className="text-white">Workspace ID: {workspaceId}</span>
                    <div className="space-x-2">
                      <Button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md" onClick={() => handleAcceptInvite(workspaceId)}>
                        Accept
                      </Button>
                      <Button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md" onClick={() => handleDeleteInvite(workspaceId)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No pending invitations.</p>
              )}
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default Profile;
