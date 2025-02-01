"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { db } from "@/config/firebase";

export default function SearchBar({ workspaceId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const auth = getAuth(); // Get the authenticated user
  const currentUserEmail = auth.currentUser?.email; // Get logged-in user's email

  useEffect(() => {
    if (searchTerm.length > 0) {
      fetchUsers(searchTerm.toLowerCase());
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

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

      // Remove logged-in user from the results
      matchedUsers = matchedUsers.filter(user => user.email !== currentUserEmail);

      setUsers(matchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (userId, userEmail) => {
    const confirmInvite = window.confirm(`Invite ${userEmail} to join the workspace?`);
    if (!confirmInvite) return;

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        invites: arrayUnion(workspaceId),
      });
      alert(`${userEmail} has been invited.`);
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  return (
    <div className=" w-[40%] h-full overflow-y-auto">
      <input
        type="text"
        placeholder="Search users by email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4 p-2 w-full border border-gray-300 rounded-md focus:outline-none"
      />
      {loading && <div className="mb-4 text-center">Loading...</div>}
      <div className="mt-2 max-h-[60vh] overflow-y-auto">
        {users.map((user) => (
          <div key={user.id} className="flex justify-between items-center p-2 bg-gray-800 rounded-md mb-2">
            <span>{user.email}</span>
            <button
              className="px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => inviteUser(user.id, user.email)}
            >
              Invite
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
