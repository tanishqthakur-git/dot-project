"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import Chat from "@/components/Chat";
import Editor from "@/components/Editor";
import NavPanel from "@/components/NavPanel";
import SearchBar from "@/components/Searchbar";

import Header from "@/components/Header";
import { Menu } from "lucide-react";

const Workspace = () => {
  const { workspaceId } = useParams(); // Get workspaceId from URL
  const [selectedFile, setSelectedFile] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false); // To toggle the chat panel

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
    <div className="flex flex-col h-screen bg-gray-950 text-white min-w-[1024px] min-h-[851px]">
      <Header />
      <SearchBar workspaceId={workspaceId} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* File Panel Toggle */}
        <button
          className="absolute top-4 left-4 z-20 p-2 hover:bg-gray-800 rounded"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Left Side - File & Folder Panel */}
        <nav
          className={`transition-all duration-300 ${
            isNavOpen ? "w-1/5" : "w-0"
          } overflow-hidden bg-gray-900 border-r border-gray-800 flex flex-col h-full`}
        >
          {isNavOpen && (
            <section className="p-4 pt-14">
              <h2 className="text-lg font-semibold">Files & Folders</h2>
              <NavPanel workspaceId={workspaceId} openFile={setSelectedFile} />
            </section>
          )}
        </nav>

        {/* Main - Editor Content */}
        <main className={`transition-all duration-300 ${
          isNavOpen && isChatOpen ? "w-3/5" : 
          isNavOpen || isChatOpen ? "w-4/5" : "w-full"
        } flex flex-col p-6 overflow-auto`}>
          <h1 className="text-2xl font-bold mb-4">Workspace: {workspaceId}</h1>
          <Editor />
        </main>

        {/* Right Side - Chat Panel */}
        <aside
          className={`transition-all duration-300 ${
            isChatOpen ? "w-1/5" : "w-0"
          } overflow-hidden bg-gray-900 border-l border-gray-800 flex flex-col h-full`}
        >
          {/* Chat Panel Toggle */}
          <button
            className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-800 rounded"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            <Menu className="h-4 w-4" />
          </button>

          {isChatOpen && (
            <section className="p-4 pt-14 h-full">
              <Chat workspaceId={workspaceId} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Workspace;