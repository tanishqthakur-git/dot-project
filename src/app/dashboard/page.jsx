"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const toastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
};

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const router = useRouter();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "workspaces"));

        const workspaceData = await Promise.all(
          querySnapshot.docs.map(async (workspaceDoc) => {
            const membersRef = collection(
              db,
              `workspaces/${workspaceDoc.id}/members`
            );
            const membersSnapshot = await getDocs(membersRef);

            const userMemberData = membersSnapshot.docs.find(
              (doc) => doc.data().userId === user.uid
            );

            if (!userMemberData) return null;

            return {
              id: workspaceDoc.id,
              ...workspaceDoc.data(),
              role: userMemberData.data().role || "Unknown",
            };
          })
        );

        setWorkspaces(workspaceData.filter(Boolean));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  const createWorkspace = async () => {
    // Use ShadCN dark modal for input
    setIsOpen(true);
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName) return;

    try {
      const workspaceRef = await addDoc(collection(db, "workspaces"), {
        name: workspaceName,
        isPublic,
      });

      const membersRef = collection(db, `workspaces/${workspaceRef.id}/members`);
      await setDoc(doc(membersRef, user.uid), {
        userId: user.uid,
        role: "owner",
        displayName: user.displayName || "Unknown",
        photoURL: user.photoURL || "/default-avatar.png",
      });
      

      setWorkspaces([
        ...workspaces,
        { id: workspaceRef.id, name: workspaceName, isPublic, role: "owner" },
      ]);
      toast.success("Workspace created successfully!", toastOptions);
      setIsOpen(false);
    } catch (error) {
      toast.error("Failed to create workspace.", toastOptions);
    }
  };

  const deleteWorkspace = async (workspaceId) => {
    const confirmationToast = toast(
      <div className="flex justify-between items-center">
        <span>Are you sure you want to delete this workspace?</span>
        <div className="flex space-x-2">
          <Button
            onClick={async () => {
              try {
                await deleteDoc(doc(db, `workspaces/${workspaceId}`));
                setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
                toast.success("Workspace deleted successfully!", toastOptions);
              } catch (error) {
                toast.error("Failed to delete workspace.", toastOptions);
              }
              toast.dismiss(confirmationToast); // Dismiss the confirmation toast after action
            }}
            className="bg-red-600 hover:bg-red-500"
          >
            Delete
          </Button>
          <Button
            onClick={() => toast.dismiss(confirmationToast)} // Dismiss the toast without action
            className="bg-gray-500 hover:bg-gray-600"
          >
            Cancel
          </Button>
        </div>
      </div>,
      {
        ...toastOptions,
        autoClose: false, // Keep the toast open until user responds
        closeOnClick: false,
        draggable: false,
        hideProgressBar: true,
      }
    );
  };

  return (
    <div className="h-screen w-screen bg-[#0F172A] text-white flex flex-col">
      <ToastContainer />
      <Header />

      <div className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold text-blue-300">Your Workspaces</h1>

        <Button
          onClick={createWorkspace}
          className="bg-blue-600 hover:bg-blue-500"
        >
          <PlusCircle size={18} className="mr-2" /> Create Workspace
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <p className="text-center text-gray-400">Loading workspaces...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {workspaces.length === 0 ? (
              <p className="text-gray-400 col-span-3 text-center">
                No workspaces found. Create one!
              </p>
            ) : (
              workspaces.map((ws) => (
                <Card
                  key={ws.id}
                  className="relative group bg-[#1E293B] border border-blue-500"
                >
                  <CardContent className="p-4">
                    <Link href={`/workspace/${ws.id}`} className="block">
                      <h2 className="text-lg font-semibold text-blue-300">
                        {ws.name}
                      </h2>
                      <p className="text-sm text-gray-400">
                        {ws.isPublic ? "Public Workspace" : "Private Workspace"}
                      </p>
                      <p className="text-xs text-yellow-400">Role: {ws.role}</p>
                    </Link>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 items-center justify-center text-red-500 hover:text-red-700  group-hover:block w-6 h-6"
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

      {/* ShadCN Modal for workspace name input and public status */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="bg-[#1E293B] text-white">
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            <p>
              Enter the name of the workspace and select if it should be public.
            </p>
            <Input
              placeholder="Workspace Name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="mb-4"
            />
            <div className="flex space-x-4 mb-4">
              <Button
                className={`${isPublic ? "bg-blue-600" : "bg-gray-500"} hover:${
                  isPublic ? "bg-blue-500" : "bg-gray-600"
                }`}
                onClick={() => setIsPublic(true)}
              >
                Public
              </Button>
              <Button
                className={`${
                  !isPublic ? "bg-blue-600" : "bg-gray-500"
                } hover:${!isPublic ? "bg-blue-500" : "bg-gray-600"}`}
                onClick={() => setIsPublic(false)}
              >
                Private
              </Button>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={handleCreateWorkspace}
                className="bg-blue-600 hover:bg-blue-500"
              >
                Create
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancel
              </Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
