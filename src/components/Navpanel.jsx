"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { Folder, File, PlusCircle, Trash, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const NavPanel = ({ workspaceId, openFile }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderStates, setFolderStates] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState(null);  // Tracking folder for file creation
  const router = useRouter();

  // Fetch folders and files
  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch role
      const membersSnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/members`));
      const membersData = membersSnapshot.docs.map((doc) => doc.data());
      const member = membersData.find((m) => m.userId === user.uid);
      if (member) {
        setUserRole(member.role);
      }

      // Fetch folders
      const foldersSnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/folders`));
      const foldersData = foldersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFolders(foldersData);

      // Initialize folder states (collapsed by default)
      const initialFolderStates = {};
      foldersData.forEach((folder) => {
        initialFolderStates[folder.id] = false;
      });
      setFolderStates(initialFolderStates);

      // Fetch files
      const filesSnapshot = await getDocs(collection(db, `workspaces/${workspaceId}/files`));
      setFiles(filesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [workspaceId]);

  // Toggle folder open/close state
  const toggleFolder = (folderId) => {
    setFolderStates((prevState) => ({
      ...prevState,
      [folderId]: !prevState[folderId],
    }));
  };

  // Create a folder (using dialog)
  const createFolder = async () => {
    if (!newFolderName) return;
    const docRef = await addDoc(collection(db, `workspaces/${workspaceId}/folders`), { name: newFolderName });
    setFolders([...folders, { id: docRef.id, name: newFolderName }]);
    setFolderStates((prevState) => ({ ...prevState, [docRef.id]: false }));
    setNewFolderName(""); // Clear input
    setIsFolderDialogOpen(false); // Close dialog
  };

  // Create a file (under a specific folder or outside any folder)
  const createFile = async () => {
    if (!newFileName) return;

    // If currentFolderId is set, create the file under that folder, otherwise create it outside any folder
    const folderId = currentFolderId || null;

    const docRef = await addDoc(collection(db, `workspaces/${workspaceId}/files`), {
      name: newFileName,
      folderId: folderId, // Set folderId to null if creating outside any folder
      workspaceId
    });

    // Update files state and reset the file creation input
    setFiles((prevFiles) => [...prevFiles, { id: docRef.id, name: newFileName, folderId: folderId, workspaceId }]);
    setNewFileName(""); // Clear input
    setIsFileDialogOpen(false); // Close dialog
    setCurrentFolderId(null); // Reset folder context
  };

  // Delete a folder or file
  const deleteItem = async (type, id) => {
    await deleteDoc(doc(db, `workspaces/${workspaceId}/${type}/${id}`));

    if (type === "folders") {
      setFolders(folders.filter((folder) => folder.id !== id));
    } else {
      setFiles(files.filter((file) => file.id !== id));
    }
  };

  return (
    <div className="bg-gray-900 text-white p-4 border-r border-gray-800">
      <h2 className="text-lg font-bold mb-4">Files & Folders</h2>

      {/* Create Folder & File Buttons */}
      {userRole === "contributor" || userRole === "owner" ? (
        <div className="mb-4 flex gap-2">
          <button onClick={() => setIsFolderDialogOpen(true)} className="flex items-center bg-blue-600 px-2 py-1 rounded-md hover:bg-blue-500">
            <PlusCircle size={16} className="mr-1" /> Folder
          </button>
          <button onClick={() => setIsFileDialogOpen(true)} className="flex items-center bg-green-600 px-2 py-1 rounded-md hover:bg-green-500">
            <PlusCircle size={16} className="mr-1" /> File
          </button>
        </div>
      ) : null}

      {/* Folder & File List */}
      <ul>
        {/* Folders */}
        {folders.map((folder) => (
          <li key={folder.id} className="mb-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                {folderStates[folder.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Folder size={16} className="mr-2 ml-1" /> {folder.name}
              </span>
              <div className="flex gap-2">
                {userRole === "editor" || userRole === "owner" ? (
                  <>
                    <PlusCircle
                      size={16}
                      className="cursor-pointer text-green-500"
                      onClick={() => {
                        setCurrentFolderId(folder.id); // Set the folder ID for file creation
                        setIsFileDialogOpen(true); // Open file creation dialog
                      }}
                    />
                    <Trash size={16} className="cursor-pointer text-red-500" onClick={() => deleteItem("folders", folder.id)} />
                  </>
                ) : null}
              </div>
            </div>

            {/* Files inside the folder */}
            {folderStates[folder.id] && (
              <ul className="ml-6">
                {files
                  .filter((file) => file.folderId === folder.id)
                  .map((file) => (
                    <li
                      key={file.id}
                      className="mb-2 flex justify-between items-center cursor-pointer"
                      onClick={() => openFile(file)}
                    >
                      <span className="flex items-center">
                        <File size={16} className="mr-2" /> {file.name}
                      </span>
                      {userRole === "editor" || userRole === "owner" ? (
                        <Trash size={16} className="cursor-pointer text-red-500" onClick={() => deleteItem("files", file.id)} />
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
          </li>
        ))}

        {/* Files outside folders */}
        {files
          .filter((file) => !file.folderId)
          .map((file) => (
            <li key={file.id} className="mb-2 flex justify-between items-center cursor-pointer">
              <span className="flex items-center" onClick={() => openFile(file)}>
                <File size={16} className="mr-2" /> {file.name}
              </span>
              {userRole === "editor" || userRole === "owner" ? (
                <Trash size={16} className="cursor-pointer text-red-500" onClick={() => deleteItem("files", file.id)} />
              ) : null}
            </li>
          ))}
      </ul>

      {/* ShadCN Modals for Folder & File Creation */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogTitle>Create Folder</DialogTitle>
          <DialogDescription>
            <Input
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-4">
              <Button onClick={createFolder} className="bg-blue-600 hover:bg-blue-500">Create</Button>
              <Button onClick={() => setIsFolderDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
        <DialogContent>
          <DialogTitle>Create File</DialogTitle>
          <DialogDescription>
            <Input
              placeholder="File Name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="mb-4"
            />
            <div className="flex gap-4">
              <Button onClick={createFile} className="bg-blue-600 hover:bg-blue-500">
                Create
              </Button>
              <Button onClick={() => setIsFileDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NavPanel;
