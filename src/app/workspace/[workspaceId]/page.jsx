"use client";

import Chat from "@/components/Chat";
import { useParams } from "next/navigation";
import Editor from "@/components/Editor";
import  NavPanel  from "@/components/Navpanel";
import { use, useEffect, useState } from "react";
import Header from "@/components/Header";

const Workspace = () => {
 
  const { workspaceId } = useParams(); // Get workspaceId from URL
  const [selectedFile, setSelectedFile] = useState(null);

 
      console.log("Selected file:", selectedFile);
  

  return (
    <div >
      <Header />
      <div className="flex-1 flex h-full">
              {/* Left Side - Nav Panel */}
              <NavPanel workspaceId={workspaceId} openFile={setSelectedFile} />

              {/* main - Workspace Content */}
              <div className="flex-1 p-6">
                <h1 className="text-2xl font-bold">Workspace: {workspaceId}</h1>
                <Editor />
              </div>

              {/* Right Side - Chat Panel */}
              <div className="w-1/3 h-full border-l border-gray-700 p-4 bg-gray-900 text-white">
                <Chat workspaceId={workspaceId} />
              </div>  
      </div>

     

    </div>
  );
};

export default Workspace;
