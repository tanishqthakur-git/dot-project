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
import { Trash2 } from "lucide-react";

function Chatroom({ workspaceId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const userId = "your-logged-in-user-id";

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"), limit(25));

  const fetchMessages = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(messagesQuery);
    const messagesData = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((msg) => msg.workspaceId === workspaceId);
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

    const imageUrl = "/robotic.png";

    try {
      const docRef = await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        imageUrl,
        userId,
        workspaceId,
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
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearMessages = async () => {
    const confirmClear = window.confirm("Are you sure you want to clear all messages?");
    if (!confirmClear) return;

    try {
      const querySnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => {
        if (doc.data().workspaceId === workspaceId) {
          batch.delete(doc.ref);
        }
      });
      await batch.commit();
      setMessages([]);
    } catch (error) {
      console.error("Error clearing messages:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading messages...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-200">Chat</h2>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={clearMessages}
          className="h-8 w-8 text-gray-400 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <p>No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-1 ${
                msg.userId === userId ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <img 
                src={msg.imageUrl} 
                alt="Avatar" 
                className="w-6 h-6 rounded-full flex-shrink-0" 
              />
              <div
                className={`p-2 text-sm rounded-lg max-w-[85%] break-words ${
                  msg.userId === userId
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

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
          <Button 
            type="submit" 
            size="sm"
            className="px-3"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chatroom;