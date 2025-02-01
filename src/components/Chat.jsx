"use client";
import { useState, useEffect } from "react";
import { firestore } from "@/config/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

function Chatroom({ workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatVisible, setChatVisible] = useState(true);
  const userId = "your-logged-in-user-id"; // Always set to the logged-in user's ID

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(
    collection(firestore, "messages"),
    orderBy("createdAt"),
    limit(25)
  );

  // Fetch workspace-specific messages
  const fetchMessages = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(messagesQuery);
    const messagesData = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((msg) => msg.workspaceId === workspaceId); // Filter messages by workspace ID
    setMessages(messagesData);
    setLoading(false);
  };

  useEffect(() => {
    if (workspaceId) {
      fetchMessages();
    }
  }, [workspaceId]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const imageUrl = "https://example.com/your-image.jpg"; // Example image URL

    try {
      console.log("Sending message...");
      const docRef = await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        imageUrl: imageUrl,
        userId: userId,
        workspaceId: workspaceId, // Associate message with workspace
      });

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: docRef.id,
          text: newMessage,
          imageUrl,
          userId,
          workspaceId,
          createdAt: { seconds: Date.now() / 1000 },
        },
      ]);

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert(`An error occurred while sending the message: ${error.message}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const clearMessages = async () => {
    const confirmClear = window.confirm("Are you sure you want to clear all messages?");
    if (!confirmClear) return;

    try {
      console.log("Clearing all messages...");
      const querySnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => {
        if (doc.data().workspaceId === workspaceId) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();

      setMessages([]);
      alert("All messages have been cleared!");
    } catch (error) {
      console.error("Error clearing messages:", error);
      alert(`An error occurred while clearing the messages: ${error.message}`);
    }
  };

  if (loading) return <p>Loading messages...</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <Button onClick={() => setChatVisible(!chatVisible)} className="mb-4">
        {chatVisible ? "Hide Chat" : "Show Chat"}
      </Button>

      {chatVisible && (
        <Card className="w-full max-w-md">
          <CardContent>
            <h2 className="text-xl font-bold mb-4">Chatroom</h2>
            <div className="space-y-2 mb-4">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 bg-gray-200 rounded-lg flex items-center ${
                      msg.userId === userId ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="User Avatar"
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    )}
                    <span>{msg.text}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No messages yet...</p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
              />
              <Button onClick={sendMessage}>Send</Button>
            </div>

            <div className="mt-4">
              <Button onClick={clearMessages} className="text-red-500">
                Clear All Messages
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Chatroom;
