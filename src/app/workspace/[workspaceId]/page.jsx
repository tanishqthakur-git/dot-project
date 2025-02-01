"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import Chat from "@/components/Chat";
import Editor from "@/components/Editor";
import NavPanel from "@/components/Navpanel";
import Header from "@/components/Header";

const Workspace = () => {
  const { workspaceId } = useParams(); // Get workspaceId from URL
  const [selectedFile, setSelectedFile] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false); // To toggle the chat panel

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;

      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceSnap = await getDoc(workspaceRef);

      if (workspaceSnap.exists()) {
        setWorkspaceName(workspaceSnap.data().name); // Get the name field from Firestore
      } else {
        console.error("Workspace not found");
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  return (
    <div>
      <Header />
      <div className="flex-1 flex h-full">
        {/* Left Side - Nav Panel */}
        <NavPanel workspaceId={workspaceId} openFile={setSelectedFile} />

        {/* Main - Workspace Content */}
        <div className="flex-1 p-6">
          <h1 className="text-2xl font-bold mb-4">Workspace: {workspaceName || "Loading..."}</h1>
          <Editor file={selectedFile} />
        </div>

        {/* Hamburger Icon to toggle the chat panel */}
        <div className="absolute top-20 right-6 z-10">
          <button 
            className="text-white p-2 rounded-full bg-gray-800 hover:bg-gray-700 focus:outline-none"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <span className="text-lg">&#9776;</span> {/* Hamburger icon */}
          </button>
        </div>

        {/* Right Side - Chat Panel */}
        {isChatOpen && (
          <div className="w-[300px] h-full border-l border-gray-700 p-4 bg-gray-900 text-white">
            <Chat workspaceId={workspaceId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspace;
