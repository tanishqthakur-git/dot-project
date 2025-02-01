"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import logout from "@/helpers/logoutHelp";

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();

  const goToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <header className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <h1 className="text-2xl font-bold">AI Code Editor</h1>
      
      <div className="flex gap-4">
        {pathname.startsWith("/workspace/") && (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={goToDashboard}
          >
            Go to Dashboard
          </button>
        )}

        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
