"use client";
import { useState, useEffect, useRef } from "react";
import { auth, firestore } from "@/config/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  where
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Chatroom({ workspaceId, setIsChatOpen }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser.uid;
  const name = auth.currentUser.displayName;

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"), limit(25));

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);

    // Real-time listener for messages
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => msg.workspaceId === workspaceId);

      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [workspaceId]);

  useEffect(() => {
    // Scroll to the bottom of the messages when new messages are received
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, newMessage]);

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

  const clearChat = async () => {
    try {
      const querySnapshot = await getDocs(
        query(messagesRef, where("workspaceId", "==", workspaceId))
      );
      
      const deletePromises = querySnapshot.docs.map((docItem) => deleteDoc(doc(messagesRef, docItem.id)));
      await Promise.all(deletePromises);
      setMessages([]);
    } catch (error) {
      console.error("Error clearing chat:", error);
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
    <div className="flex flex-col h-full p-1 rounded-3xl ring-1  ">
      {/* Header */}
      <div className="flex justify-between bg-teal-600 bg-opacity-20 ring-1 ring-teal-300 items-center py-2 px-4 rounded-md">
        <h2 className="text-xl font-mono text-gray-200">Chat</h2>
        <div className="flex gap-2">
          <button
            className=" bg-red-500 text-white mr-3 text-sm px-2 py-1 rounded-md bg-opacity-60 hover:bg-red-600 ring-1 ring-red-400 "
            onClick={clearChat}
          >
            Clear Chat
          </button>
          <button
            className="text-gray-200 hover:text-gray-100"
            onClick={() => setIsChatOpen(false)}
          >
            X
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 rounded-3xl">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm rounded-3xl">
            <p>No messages yet</p>
            <p className="text-xs">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.userId === userId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isCurrentUser ? "items-end" : "items-start"}`}
              >
                <span className="text-xs text-gray-400">{msg.name}</span>
                <div className="flex  justify-end gap-2">
                  {!isCurrentUser && (
                    <img
                      src={msg.imageUrl}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full flex-shrink-0"
                    />
                  )}
                  <div
                    className={`py-1 px-3 text-sm rounded-lg max-w-[75%] break-words ${
                      isCurrentUser
                        ? "bg-purple-700 bg-opacity-40 text-white self-end"
                        : "bg-gray-800 bg-opacity-40 text-gray-200 self-start"
                    }`}
                  >
                    {msg.text}
                  </div>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <div className="p-2 border-t border-gray-800 bg-opacity-60 backdrop-blur-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="flex bg-gray-800 bg-opacity-60 border-gray-700 focus:border-gray-600 text-sm"
          />
          <Button type="submit" size="sm" className="px-3 bg-gray-800 hover:bg-gray-700 text-white">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chatroom;
