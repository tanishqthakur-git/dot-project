"use client";

import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import {
  Folder,
  File,
  PlusCircle,
  Trash,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

  const truncateName = (name) => {
    return name.length > 20 ? `${name.substring(0, 20)}...` : name;
  };

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
      const foldersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
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
      if (snapshot.docs.length > 0);
    });

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
    await addDoc(collection(db, `workspaces/${workspaceId}/folders`), {
      name: newFolderName,
      parentFolderId: selectedParentFolder,
    });
    setNewFolderName("");
    setSelectedParentFolder(null);
    setIsFolderDialogOpen(false);
  };

  const createFile = async () => {
    if (!newFileName) return;
    await addDoc(collection(db, `workspaces/${workspaceId}/files`), {
      name: newFileName,
      folderId: currentFolderId,
      workspaceId,
    });
    setNewFileName("");
    setIsFileDialogOpen(false);
    setCurrentFolderId(null);
  };

  const deleteItem = async (type, id) => {
    if (type === "folders") {
      await deleteDoc(doc(db, `workspaces/${workspaceId}/folders/${id}`));
      const nestedFolders = folders.filter(
        (folder) => folder.parentFolderId === id
      );
      for (const nestedFolder of nestedFolders) {
        await deleteItem("folders", nestedFolder.id);
      }
      const folderFiles = files.filter((file) => file.folderId === id);
      for (const file of folderFiles) {
        await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${file.id}`));
      }
    } else {
      await deleteDoc(doc(db, `workspaces/${workspaceId}/files/${id}`));
    }
  };

  const renderFolder = (folder) => {
    const nestedFolders = folders.filter((f) => f.parentFolderId === folder.id);
    const folderFiles = files.filter((file) => file.folderId === folder.id);

    return (
      <div key={folder.id} className="ml-4 border-l border-gray-700">
        <div className="flex items-center justify-between group hover:bg-gray-800 px-2 py-1 rounded transition-colors">
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => toggleFolder(folder.id)}
          >
            {folderStates[folder.id] ? (
              <ChevronDown size={16} className="mr-1" />
            ) : (
              <ChevronRight size={16} className="mr-1" />
            )}
            <Folder size={16} className="mr-2 text-blue-400" />
            <span className="text-sm">{truncateName(folder.name)}</span>
          </div>

          {(userRole === "contributor" || userRole === "owner") && (
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
              <Folder
                size={14}
                className="text-blue-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedParentFolder(folder.id);
                  setIsFolderDialogOpen(true);
                }}
              />
              <File
                size={14}
                className="text-green-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentFolderId(folder.id);
                  setIsFileDialogOpen(true);
                }}
              />
              <Trash
                size={14}
                className="text-gray-400 hover:text-red-400 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem("folders", folder.id);
                }}
              />
            </div>
          )}
        </div>

        {folderStates[folder.id] && (
          <div className="ml-2">
            {nestedFolders.map((nestedFolder) => renderFolder(nestedFolder))}
            {folderFiles.map((file) => (
              <div
                key={file.id}
                className="ml-6 flex items-center justify-between group hover:bg-gray-800 px-2 py-1 rounded transition-colors"
              >
                <div
                  className="flex items-center cursor-pointer flex-1"
                  onClick={() => openFile(file)}
                >
                  <File size={16} className="mr-2 text-gray-400" />
                  <span className="text-sm">{truncateName(file.name)}</span>
                </div>
                {(userRole === "contributor" || userRole === "owner") && (
                  <Trash
                    size={14}
                    className="text-gray-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem("files", file.id);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 text-gray-300 h-full w-full flex flex-col border-r border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold mb-4">FILE EXPLORER</h2>
        <div className="flex space-x-2">
          {(userRole === "contributor" || userRole === "owner") && (
            <>
              <button
                onClick={() => {
                  setSelectedParentFolder(null);
                  setIsFolderDialogOpen(true);
                }}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <Folder size={16} className="text-blue-400" />
              </button>
              <button
                onClick={() => setIsFileDialogOpen(true)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <File size={16} className="text-green-400" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {folders
          .filter((folder) => !folder.parentFolderId)
          .map((folder) => renderFolder(folder))}

        {files
          .filter((file) => !file.folderId)
          .map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between group hover:bg-gray-800 px-2 py-1 rounded transition-colors"
            >
              <div
                className="flex items-center cursor-pointer flex-1"
                onClick={() => openFile(file)}
              >
                <File size={16} className="mr-2 text-gray-400" />
                <span className="text-sm">{truncateName(file.name)}</span>
              </div>
              {(userRole === "contributor" || userRole === "owner") && (
                <Trash
                  size={14}
                  className="text-gray-400 hover:text-red-400 cursor-pointer opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem("files", file.id);
                  }}
                />
              )}
            </div>
          ))}
      </div>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogTitle>
            {selectedParentFolder ? "New Nested Folder" : "New Folder"}
          </DialogTitle>
          <DialogDescription>
            <Input
              className="mb-4 bg-gray-700 border-gray-600 text-white"
              placeholder="Enter folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setIsFolderDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={createFolder}>Create</Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>

      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
        <DialogContent className="bg-gray-800 text-white">
          <DialogTitle>New File</DialogTitle>
          <DialogDescription>
            <Input
              className="mb-4 bg-gray-700 border-gray-600 text-white"
              placeholder="Enter file name"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                onClick={() => setIsFileDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={createFile}>Create</Button>
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NavPanel;