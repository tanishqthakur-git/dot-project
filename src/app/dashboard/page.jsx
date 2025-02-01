"use client";
import { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { PlusCircle, Users, Folder, File, Trash2 } from "lucide-react";
import Header from "@/components/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser; // Get the logged-in user
  const router = useRouter();

  // Fetch workspaces where the logged-in user is the owner
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    } // Ensure user is logged in before fetching workspaces

    const fetchWorkspaces = async () => {
      try {
        const workspaceQuery = query(collection(db, "workspaces"), where("owner", "==", user.uid));
        const querySnapshot = await getDocs(workspaceQuery);

        const workspaceData = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            let members = [];
            let folders = [];
            let files = [];

            if (data.isPublic) {
              const membersSnapshot = await getDocs(collection(db, `workspaces/${doc.id}/members`));
              members = membersSnapshot.docs.map((memberDoc) => ({
                id: memberDoc.id,
                ...memberDoc.data(),
              }));
            }

            // Fetch files directly inside workspace
            const filesSnapshot = await getDocs(collection(db, `workspaces/${doc.id}/files`));
            files = filesSnapshot.docs.map((fileDoc) => ({
              id: fileDoc.id,
              ...fileDoc.data(),
            }));

            // Fetch folders and their files
            const foldersSnapshot = await getDocs(collection(db, `workspaces/${doc.id}/folders`));
            folders = await Promise.all(
              foldersSnapshot.docs.map(async (folderDoc) => {
                const folderFilesSnapshot = await getDocs(collection(db, `workspaces/${doc.id}/folders/${folderDoc.id}/files`));
                const folderFiles = folderFilesSnapshot.docs.map((fileDoc) => ({
                  id: fileDoc.id,
                  ...fileDoc.data(),
                }));
                return { id: folderDoc.id, ...folderDoc.data(), files: folderFiles };
              })
            );

            return { id: doc.id, ...data, members, folders, files };
          })
        );

        setWorkspaces(workspaceData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user]);

  // Create new workspace
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

    setWorkspaces([...workspaces, { id: docRef.id, name, isPublic, owner: user.uid, members: isPublic ? [{ id: user.uid, role: "owner" }] : [], folders: [], files: [] }]);
  };

  // Delete workspace
  const deleteWorkspace = async (workspaceId) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;

    try {
      // Delete all files inside the workspace
      const filesSnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/files`));
      filesSnapshot.forEach(async (fileDoc) => {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${fileDoc.id}`));
      });

      // Delete all folders and their files
      const foldersSnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/folders`));
      foldersSnapshot.forEach(async (folderDoc) => {
        const folderFilesSnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/folders/${folderDoc.id}/files`));
        folderFilesSnapshot.forEach(async (fileDoc) => {
          await deleteDoc(doc(db, `workspaces/${workspaceId}/folders/${folderDoc.id}/files/${fileDoc.id}`));
        });

        await deleteDoc(doc(db, `workspaces/${workspaceId}/folders/${folderDoc.id}`));
      });

      // Delete members (if public)
      const membersSnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/members`));
      membersSnapshot.forEach(async (memberDoc) => {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/members/${memberDoc.id}`));
      });

      // Delete workspace document
      await deleteDoc(doc(db, `workspaces/${workspaceId}`));

      // Update UI
      setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
    } catch (error) {
      console.error("Error deleting workspace:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Header />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Workspaces</h1>
        <button onClick={createWorkspace} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-md">
          <PlusCircle size={20} className="mr-2" /> Create Workspace
        </button>
      </div>

      {loading ? (
        <p>Loading workspaces...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaces.map((ws) => (
            <Link href={`/workspace/${ws.id}`} key={ws.id} className="p-4 bg-gray-800 text-white rounded-lg relative">
              <h2 className="text-lg font-semibold">{ws.name}</h2>
              <p className="text-sm text-gray-300">{ws.isPublic ? "Public Workspace" : "Private Workspace"}</p>

              {ws.isPublic && (
                <div className="mt-2">
                  <h3 className="text-sm font-semibold">Members:</h3>
                  <ul className="mt-1 text-sm">
                    {ws.members.map((member) => (
                      <li key={member.id} className="text-gray-300">
                        {member.id} - <span className="font-bold">{member.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteWorkspace(ws.id);
                }}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
              >
                <Trash2 size={20} />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
