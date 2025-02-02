"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot } from "firebase/firestore";
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
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedParentFolder, setSelectedParentFolder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.push("/login");
      return;
    }

    const membersRef = collection(db, `workspaces/${workspaceId}/members`);
    const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
      const membersData = snapshot.docs.map((doc) => doc.data());
      const member = membersData.find((m) => m.userId === user.uid);
      if (member) setUserRole(member.role);
    });

    const foldersRef = collection(db, `workspaces/${workspaceId}/folders`);
    const unsubscribeFolders = onSnapshot(foldersRef, (snapshot) => {
      const foldersData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFolders(foldersData);

      const initialFolderStates = {};
      foldersData.forEach((folder) => {
        initialFolderStates[folder.id] = false;
      });
      setFolderStates(initialFolderStates);
    });

    const filesRef = collection(db, `workspaces/${workspaceId}/files`);
    const unsubscribeFiles = onSnapshot(filesRef, (snapshot) => {
      setFiles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      openFile(files[0]);
    });

    openFile(files[0]);

    return () => {
      unsubscribeMembers();
      unsubscribeFolders();
      unsubscribeFiles();
    };
  }, [workspaceId]);

  const toggleFolder = (folderId) => {
    setFolderStates((prevState) => ({
      ...prevState,
      [folderId]: !prevState[folderId],
    }));
  };

  const createFolder = async () => {
    if (!newFolderName) return;
    const docRef = await addDoc(collection(db, `workspaces/${workspaceId}/folders`), { 
      name: newFolderName,
      parentFolderId: selectedParentFolder // Can be null for root-level folders
    });
    setFolderStates((prevState) => ({ ...prevState, [docRef.id]: false }));
    setNewFolderName("");
    setSelectedParentFolder(null);
    setIsFolderDialogOpen(false);
  };

  const createFile = async () => {
    if (!newFileName) return;
    const folderId = currentFolderId || null;

    const docRef = await addDoc(collection(db, `workspaces/${workspaceId}/files`), {
      name: newFileName,
      folderId: folderId,
      workspaceId
    });

    setNewFileName("");
    setIsFileDialogOpen(false);
    setCurrentFolderId(null);
  };

  const deleteItem = async (type, id) => {
    // When deleting a folder, also delete all nested folders and files
    if (type === "folders") {
      // Delete the folder itself
      await deleteDoc(doc(db, `workspaces/${workspaceId}/folders/${id}`));
      
      // Delete all nested folders
      const nestedFolders = folders.filter(folder => folder.parentFolderId === id);
      for (const nestedFolder of nestedFolders) {
        await deleteItem("folders", nestedFolder.id);
      }
      
      // Delete all files in the folder
      const folderFiles = files.filter(file => file.folderId === id);
      for (const file of folderFiles) {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${file.id}`));
      }
    } else {
      await deleteDoc(doc(db, `workspaces/${workspaceId}/${type}/${id}`));
    }
  };

 // Recursive function to render folder structure
 const renderFolder = (folder) => {
  const nestedFolders = folders.filter(f => f.parentFolderId === folder.id);
  const folderFiles = files.filter(file => file.folderId === folder.id);

  return (
    <li key={folder.id} className="mb-2">
      <div className="flex justify-between items-center">
        <span className="flex items-center cursor-pointer" onClick={() => toggleFolder(folder.id)}>
          {folderStates[folder.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Folder size={16} className="mr-2 ml-1" /> {folder.name}
        </span>
        <div className="flex gap-2">
          {userRole === "contributor" || userRole === "owner" ? (
            <>
              <PlusCircle
                size={16}
                className="cursor-pointer text-blue-500"
                onClick={() => {
                  setSelectedParentFolder(folder.id);
                  setIsFolderDialogOpen(true);
                }}
              />
              <PlusCircle
                size={16}
                className="cursor-pointer text-green-500"
                onClick={() => {
                  setCurrentFolderId(folder.id);
                  setIsFileDialogOpen(true);
                }}
              />
              <Trash size={16} className="cursor-pointer text-red-500" onClick={() => deleteItem("folders", folder.id)} />
            </>
          ) : null}
        </div>
      </div>

      {folderStates[folder.id] && (
        <ul className="ml-6">
          {/* Render nested folders */}
          {nestedFolders.map(nestedFolder => renderFolder(nestedFolder))}
          
          {/* Render files in this folder */}
          {folderFiles.map((file) => (
            <li
              key={file.id}
              className="mb-2 flex justify-between items-center cursor-pointer"
              onClick={() => openFile(file)}
            >
              <span className="flex items-center">
                <File size={16} className="mr-2" /> {file.name}
              </span>
              {userRole === "contributor" || userRole === "owner" ? (
                <Trash size={16} className="cursor-pointer text-red-500" onClick={() => deleteItem("files", file.id)} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

return (
  <div className="bg-gray-900 text-white py-4 px-1 border-r border-gray-800">
    <h2 className="text-lg font-mono mb-4">Files & Folders</h2>

    {userRole === "contributor" || userRole === "owner" ? (
      <div className="mb-4 flex gap-2">
        <button onClick={() => {
          setSelectedParentFolder(null);
          setIsFolderDialogOpen(true);
        }} className="flex items-center bg-blue-600 px-2 py-1 rounded-md hover:bg-blue-500">
          <PlusCircle size={16} className="mr-1" /> Folder
        </button>
        <button onClick={() => setIsFileDialogOpen(true)} className="flex items-center bg-green-600 px-2 py-1 rounded-md hover:bg-green-500">
          <PlusCircle size={16} className="mr-1" /> File
        </button>
      </div>
    ) : null}

    <ul>
      {/* Render root-level folders */}
      {folders
        .filter(folder => !folder.parentFolderId)
        .map(folder => renderFolder(folder))}

      {/* Render root-level files */}
      {files
        .filter((file) => !file.folderId)
        .map((file) => (
          <li key={file.id} className="mb-2 flex justify-between items-center cursor-pointer">
            <span className="flex items-center" onClick={() => openFile(file)}>
              <File size={16} className="mr-2" /> {file.name}
            </span>
            {userRole === "contributor" || userRole === "owner" ? (
              <Trash size={16} className="cursor-pointer text-red-500" onClick={() => deleteItem("files", file.id)} />
            ) : null}
          </li>
        ))}
    </ul>

    <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
      <DialogContent>
        <DialogTitle>Create Folder {selectedParentFolder ? '(Nested)' : '(Root)'}</DialogTitle>
        <DialogDescription>
          <Input
            placeholder="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="mb-4"
          />
          <div className="flex gap-4">
            <Button onClick={createFolder} className="bg-blue-600 hover:bg-blue-500">Create</Button>
            <Button onClick={() => {
              setIsFolderDialogOpen(false);
              setSelectedParentFolder(null);
            }} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
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
            <Button onClick={createFile} className="bg-blue-600 hover:bg-blue-500">Create</Button>
            <Button onClick={() => setIsFileDialogOpen(false)} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  </div>
  );
};

export default NavPanel;
