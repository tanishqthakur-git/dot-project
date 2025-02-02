"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import SearchBar from "./Searchbar";
import InviteNotification from "./InviteNotification";
import { auth } from "@/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase"; // Firestore instance
import { LayoutDashboard } from "lucide-react";

const Header = ({ workspaceId }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true); // Default to public

  useEffect(() => {
    if (!workspaceId) return;

    const fetchWorkspaceDetails = async () => {
      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceSnap = await getDoc(workspaceRef);

      if (workspaceSnap.exists()) {
        setIsPublic(workspaceSnap.data().isPublic ?? true); // Default to true if field is missing
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <header className="flex items-center justify-between px-8 py-3 bg-[#1e293b] text-white shadow-lg">
      <h1 className="text-2xl font-bold">AI Code Editor</h1>
      <InviteNotification />
      <div className="flex items-center gap-4">
        {/* Show SearchBar only if workspace is Public */}
        {pathname.startsWith("/workspace/") && isPublic && (
          <SearchBar workspaceId={workspaceId} />
        )}

        {pathname.startsWith("/workspace/") && (
          <Button
            onClick={goToDashboard}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <LayoutDashboard className="w-5 h-5" />
            Go to Dashboard
          </Button>
        )}

        {/* Wrap the Avatar component in a Link */}
        <Link href="/profile">
          <Avatar className="w-10 h-10 cursor-pointer border-2 border-white">
            <AvatarImage src={auth.currentUser?.photoURL} alt="Profile" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default Header;
