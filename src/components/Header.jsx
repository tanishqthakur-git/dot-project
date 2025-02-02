"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import logout from "@/helpers/logoutHelp";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import SearchBar from "./Searchbar";
import InviteNotification from "./InviteNotification";
import {auth} from "@/config/firebase"


const Header = ({ workspaceId }) => {
  const pathname = usePathname();
  const router = useRouter();

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <header className="flex items-center justify-between px-8 py-3 bg-[#1e293b] text-white shadow-lg">
      <h1 className="text-2xl font-bold">AI Code Editor</h1>
      < InviteNotification />
      <div className="flex items-center gap-4">
        {pathname.startsWith("/workspace/") && (
          <SearchBar workspaceId={workspaceId} />
          
        )}

        {
          pathname.startsWith("/workspace/") && (
            <Button onClick={goToDashboard} className="bg-blue-500 hover:bg-blue-600">
            Go to Dashboard
          </Button>
          )
        }
        
        
        
        {/* Wrap the Avatar component in a Link */}
        <Link href="/profile">
          <Avatar className="w-10 h-10 cursor-pointer border-2 border-white">
          <AvatarImage src={auth.currentUser.photoURL} alt="Profile" />

            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default Header;
