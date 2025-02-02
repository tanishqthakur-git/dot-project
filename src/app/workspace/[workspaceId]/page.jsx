"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebase";
import Chat from "@/components/Chat";
import Editor from "@/components/Editor";
import SearchBar from "@/components/Searchbar";
import { MessageCircle, Menu } from "lucide-react"; // Chat & Menu icons
import Header from "@/components/Header";
import ShowMembers from "@/components/Members";
import NavPanel from "@/components/NavPanel";

const Workspace = () => {
  const { workspaceId } = useParams(); // Get workspaceId from URL
  const [selectedFile, setSelectedFile] = useState({ name: "sample", content: "" });
  const [workspaceName, setWorkspaceName] = useState("");
  const [membersCount, setMembersCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId) return;

      const workspaceRef = doc(db, "workspaces", workspaceId);
      const workspaceSnap = await getDoc(workspaceRef);

      if (workspaceSnap.exists()) {
        const workspaceData = workspaceSnap.data();
        setWorkspaceName(workspaceData.name);

        const membersRef = collection(db, `workspaces/${workspaceId}/members`);
        const membersSnap = await getDocs(membersRef);
        setMembersCount(membersSnap.size);
      } else {
        console.error("Workspace not found");
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white min-w-[1024px] relative">
      {/* Header */}
      <Header workspaceId={workspaceId} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* File Panel Toggle */}
        <button
          className="absolute top-3 left-4 z-20 p-2 hover:bg-gray-800 rounded"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          <Menu size={24} className="h-4 w-4" />
        </button>

        {/* Left Side - File & Folder Panel */}
        <nav
          className={`transition-all duration-300 ${
            isNavOpen ? "w-[20%]" : "w-0"
          } overflow-hidden bg-gray-900 border-r border-gray-800 flex flex-col h-full`}
        >
          {isNavOpen && (
            <section className="pt-8">
              <NavPanel workspaceId={workspaceId} openFile={setSelectedFile} />
            </section>
          )}
        </nav>

        {/* Main - Editor Content */}
        <main className="flex-1 flex flex-col py-2 px-6 overflow-auto">
          <div className="flex gap-12 items-center justify-between">
            <h1 className="text-4xl border-b-2  border-gray-200 font-mono ml-8">Workspace: <span>{workspaceName}</span></h1>
            <span className="text-lg text-gray-200 bg-gray-800 px-4 py-2 rounded-full flex items-center gap-3">
               <p>people: {membersCount}</p>
               <ShowMembers workspaceId={workspaceId} />
            </span>
          </div>

          <Editor file={selectedFile} />
        </main>
      </div>

      {/* Chat Panel (Overlapping from Bottom) */}
      <aside
        className={`fixed bottom-0 right-0 transition-all duration-300 bg-gray-900 border-t border-gray-800 shadow-lg ${
          isChatOpen ? "h-[60%]" : "h-0"
        } overflow-hidden w-[30%]`}
      >
        {isChatOpen && (
          <section className="h-full rounded-3xl">
            <Chat workspaceId={workspaceId} isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
          </section>
        )}
      </aside>

      {/* Chat Toggle Button */}
      {
        !isChatOpen && (
            <button
              className="fixed bottom-4 right-4 z-30 p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full shadow-lg"
              onClick={() => setIsChatOpen(!isChatOpen)}
            >
            <MessageCircle className="h-6 w-6" />
          </button>
        )
      }
    </div>
  );
};

export default Workspace;
