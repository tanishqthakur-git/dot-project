"use client";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { db } from "@/config/firebase";
import { UserPlus, X } from "lucide-react"; // Import icons
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast

export default function SearchBar({ workspaceId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Toggle search bar visibility
  const auth = getAuth();
  const currentUserEmail = auth.currentUser?.email;
  const searchRef = useRef(null);

  useEffect(() => {
    if (searchTerm.length > 0) {
      fetchUsers(searchTerm.toLowerCase());
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false); // Close search bar when clicking outside
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const fetchUsers = async (term) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("email", ">=", term),
        where("email", "<=", term + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);
      let matchedUsers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      matchedUsers = matchedUsers.filter(user => user.email !== currentUserEmail);
      setUsers(matchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users", {
        style: {
          background: '#1f2937',
          color: 'white',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: 'white',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId, userEmail) => {
    // Custom confirmation dialog using react-hot-toast

    if (!confirmInvite) return;

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        invites: arrayUnion(workspaceId),
      });
      
      toast.success(`${userEmail} has been invited.`, {
        style: {
          background: '#1f2937',
          color: 'white',
        },
        iconTheme: {
          primary: '#3b82f6',
          secondary: 'white',
        },
      });
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation", {
        style: {
          background: '#1f2937',
          color: 'white',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: 'white',
        },
      });
    }
  };

  return (
    <div className="relative ">
      {/* Invite Button */}
      <button
        className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <UserPlus className="w-7 h-8 text-white" />
      </button>

      {/* Search Bar & Dropdown (Overlay) */}
      {isOpen && (
        <div ref={searchRef} className="absolute top-12 right-0 bg-gray-900 p-4 rounded-lg shadow-lg w-80 z-50">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-600 pb-2">
            <input
              type="text"
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-white p-2 outline-none"
            />
            <button className="ml-2 text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && <div className="text-gray-400 text-center mt-2">Loading...</div>}

          {/* User List */}
          <div className="mt-2 max-h-60 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-2 hover:bg-gray-800 rounded-md">
                <span className="text-white">{user.email}</span>
                <button
                  className="p-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() => inviteUser(user.id, user.email)}
                >
                  Invite
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast Container */}
      <Toaster
        position="right-center"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
        }}
      />
    </div>
  );
}