"use client";

import { useEffect, useState } from "react";
import { onSnapshot, doc, updateDoc, arrayRemove, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthProvider";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const InviteNotification = () => {
  const { user } = useAuth();
  const [invites, setInvites] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setInvites(docSnap.data().invites || []);
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [user]);

  const handleAcceptInvite = async (workspaceId) => {
    if (!user) return;

    try {
      const membersRef = doc(db, `workspaces/${workspaceId}/members`, user.uid);
      await setDoc(membersRef, {
        userId: user.uid,
        role: "contributor",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/default-avatar.png",
      });

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        invites: arrayRemove(workspaceId),
      });

      setInvites((prev) => prev.filter((id) => id !== workspaceId));
      toast.success("You have joined the workspace!");
      router.push("/workspace/" + workspaceId);
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

      setInvites((prev) => prev.filter((id) => id !== workspaceId));
      toast.info("Invite declined.");
    } catch (error) {
      console.error("Error deleting invite:", error);
    }
  };

  const handleDismiss = (workspaceId) => {
    setInvites((prev) => prev.filter((id) => id !== workspaceId));
  };

  return (
    <div className="fixed bottom-5 right-5 space-y-3 z-50">
      <AnimatePresence>
        {invites.map((workspaceId) => (
          <motion.div
            key={workspaceId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-96 shadow-lg border border-gray-200 bg-white rounded-2xl">
              <CardHeader className="flex justify-between items-center border-b p-4  ">
                <CardTitle className="text-lg font-semibold text-black">Workspace Invite</CardTitle>
                <button onClick={() => handleDismiss(workspaceId)} className="text-gray-500 hover:text-gray-700">
                  <X size={18} />
                </button>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-gray-700 text-sm">
                  You have been invited to join workspace: <span className="font-medium">{workspaceId}</span>
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    onClick={() => handleAcceptInvite(workspaceId)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleDeleteInvite(workspaceId)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default InviteNotification;
