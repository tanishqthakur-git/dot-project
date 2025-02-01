"use client";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // Import Firebase Auth
import { db } from "@/config/firebase";
import { Button, Input, Box, VStack, HStack, Text, Spinner } from "@chakra-ui/react";

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
    <Box p={4} w="100%">
      <Input
        placeholder="Search users by email..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading && <Spinner size="sm" mt={2} />}
      <VStack mt={2} align="start">
        {users.map((user) => (
          <HStack key={user.id} w="100%" justify="space-between">
            <Text>{user.email}</Text>
            <Button colorScheme="blue" size="sm" onClick={() => inviteUser(user.id, user.email)}>
              Invite
            </Button>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}
