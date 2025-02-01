"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { Folder, File, PlusCircle, Trash, ChevronDown, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const NavPanel = ({ workspaceId, openFile }) => {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [folderStates, setFolderStates] = useState({});
  const [userRole, setUserRole] = useState(null);
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
      const membersData = membersSnapshot.docs.map((doc) => doc.data()); // Convert docs to data array
      const member = membersData.find((m) => m.userId === user.uid); // Find the current user's entry
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

  // Create a folder
const createFolder = async () => {
  const name = prompt("Enter folder name:");
  if (!name) return;
  const docRef = await addDoc(collection(db, `workspaces/${workspaceId}/folders`), { name });
  setFolders([...folders, { id: docRef.id, name }]);
  setFolderStates((prevState) => ({ ...prevState, [docRef.id]: false }));
};

// Create a file (outside folders)
const createFile = async () => {
  const name = prompt("Enter file name:");
  if (!name) return;
  const docRef = await addDoc(collection(db, `workspaces/${workspaceId}/files`), { 
    name, 
    folderId: null,
    workspaceId 
  });
  setFiles([...files, { id: docRef.id, name, folderId: null, workspaceId }]);
};

// Create a file inside a folder
const createFileInFolder = async (folderId) => {
  const name = prompt("Enter file name:");
  if (!name) return;
  const docRef = await addDoc(collection(db, `workspaces/${workspaceId}/files`), { 
    name, 
    folderId, 
    workspaceId 
  });
  setFiles([...files, { id: docRef.id, name, folderId, workspaceId }]);
  if(!folderStates[folderId]) toggleFolder(folderId);
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
    <div className="bg-gray-800 text-white p-4 border-r border-gray-700">
      <h2 className="text-lg font-bold mb-4">Files & Folders</h2>

      {/* Create Folder & File Buttons */}
      {userRole === "contributor" || userRole === "owner" ? (
        <div className="mb-4 flex gap-2">
          <button onClick={createFolder} className="flex items-center bg-blue-600 px-2 py-1 rounded-md">
            <PlusCircle size={16} className="mr-1" /> Folder
          </button>
          <button onClick={createFile} className="flex items-center bg-green-600 px-2 py-1 rounded-md">
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
                      onClick={() => createFileInFolder(folder.id)}
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
            <li key={file.id} className="mb-2 flex justify-between items-center cursor-pointer" >
              <span className="flex items-center" onClick={() => openFile(file)}>
                <File size={16} className="mr-2" /> {file.name}
              </span>
              {userRole === "editor" || userRole === "owner" ? (
                <Trash size={16} className="cursor-pointer text-red-500" onClick={() => deleteItem("files", file.id)} />
              ) : null}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default NavPanel;
