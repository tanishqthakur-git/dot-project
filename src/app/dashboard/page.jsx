"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import { 
  collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where 
} from "firebase/firestore";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Link from "next/link";

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const workspaceQuery = query(
          collection(db, "workspaces"),
          where("owner", "==", user.uid)
        );
        const querySnapshot = await getDocs(workspaceQuery);

        const workspaceData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setWorkspaces(workspaceData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  const createWorkspace = async () => {
    const name = prompt("Enter workspace name:");
    if (!name) return;

    const isPublic = window.confirm("Should this workspace be public?");
    
    if (!user) {
      alert("You must be logged in to create a workspace.");
      return;
    }

    const docRef = await addDoc(collection(db, "workspaces"), {
      name,
      isPublic,
      owner: user.uid,
    });

    if (isPublic) {
      await setDoc(doc(db, `workspaces/${docRef.id}/members/${user.uid}`), {
        role: "owner",
      });
    }

    setWorkspaces([...workspaces, { id: docRef.id, name, isPublic, owner: user.uid }]);
  };

  const deleteWorkspace = async (workspaceId) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;

    try {
      await deleteDoc(doc(db, `workspaces/${workspaceId}`));
      setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
    } catch (error) {
      console.error("Error deleting workspace:", error);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0F172A] text-white flex flex-col">
      <Header />
      
      <div className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold text-blue-300">Your Workspaces</h1>
        
        <Button onClick={createWorkspace} className="bg-blue-600 hover:bg-blue-500">
          <PlusCircle size={18} className="mr-2" /> Create Workspace
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-center text-gray-400">Loading workspaces...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workspaces.length === 0 ? (
              <p className="text-gray-400 col-span-3 text-center">No workspaces found. Create one!</p>
            ) : (
              workspaces.map((ws) => (
                <Card key={ws.id} className="relative group bg-[#1E293B] border border-blue-500">
                  <CardContent className="p-4">
                    <Link href={`/workspace/${ws.id}`} className="block">
                      <h2 className="text-lg font-semibold text-blue-300">{ws.name}</h2>
                      <p className="text-sm text-gray-400">
                        {ws.isPublic ? "Public Workspace" : "Private Workspace"}
                      </p>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 hidden group-hover:block"
                      onClick={(e) => {
                        e.preventDefault();
                        deleteWorkspace(ws.id);
                      }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
