"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import logout from "@/helpers/logoutHelp";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";


const Header = () => {
  const pathname = usePathname();
  const router = useRouter();

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <header className="flex items-center justify-between p-4 bg-[#1e293b] text-white shadow-lg">
      <h1 className="text-2xl font-bold">AI Code Editor</h1>
      
      <div className="flex items-center gap-4">
        {pathname.startsWith("/workspace/") && (
          <Button onClick={goToDashboard} className="bg-blue-500 hover:bg-blue-600">
            Go to Dashboard
          </Button>
        )}
        
        <Button onClick={logout} className="bg-red-500 hover:bg-red-600">
          Logout
        </Button>
        
        {/* Wrap the Avatar component in a Link */}
        <Link href="/profile">
          <Avatar className="w-10 h-10 cursor-pointer border-2 border-white">
          <AvatarImage src="/robotic.png" alt="Profile" />

            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};

export default Header;
