"use client";
import { useState, useEffect } from "react";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Chatroom({ workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser.uid;
  const name = auth.currentUser.displayName;

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"), limit(25));

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);

    // **Real-time listener for messages**
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => msg.workspaceId === workspaceId);

      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [workspaceId]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const imageUrl = "/robotic.png";

    try {
      await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        imageUrl,
        userId,
        name,
        workspaceId,
      });

      setNewMessage(""); // Clear input after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <p>No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.userId === userId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${
                  isCurrentUser ? "items-end" : "items-start"
                }`}
              >
                {/* Show name above the message */}
                <span className="text-xs text-gray-400">{msg.name}</span>

                <div className="flex items-start gap-2">
                  {/* Avatar for other users */}
                  {!isCurrentUser && (
                    <img
                      src={msg.imageUrl}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full flex-shrink-0"
                    />
                  )}

                  <div
                    className={`p-2 text-sm rounded-lg max-w-[75%] break-words ${
                      isCurrentUser
                        ? "bg-blue-600 text-white self-end" // Current user's messages on the right
                        : "bg-gray-800 text-gray-200 self-start" // Other user's messages on the left
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Avatar for current user */}
                  {isCurrentUser && (
                    <img
                      src={msg.imageUrl}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full flex-shrink-0"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Field */}
      <div className="p-2 border-t border-gray-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-1"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex-1 bg-gray-800 border-gray-700 focus:border-gray-600 text-sm"
          />
          <Button type="submit" size="sm" className="px-3">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chatroom;
