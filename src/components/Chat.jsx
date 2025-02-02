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
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyBw1nRXZx4-IVw4lX3c8G6rSLYT8XacEnE");

function Chatroom({ workspaceId, setIsChatOpen }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAIProcessing, setIsAIProcessing] = useState(false);

  const userId = auth.currentUser.uid;
  const name = auth.currentUser.displayName;

  const messagesRef = collection(firestore, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt"), limit(25));

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) return;

    setLoading(true);

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => msg.workspaceId === workspaceId);

      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [workspaceId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, newMessage, isAIProcessing]);

  const generateAIResponse = async (prompt) => {
    setIsAIProcessing(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("AI Error:", error);
      return "Sorry, I couldn't process that request. Please try again.";
    } finally {
      setIsAIProcessing(false);
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const imageUrl = auth.currentUser.photoURL;
    const aiMatch = newMessage.match(/@(.+)/);
    let aiPrompt = null;
    let userMessage = newMessage;

    if (aiMatch) {
      aiPrompt = aiMatch[1].trim();
      userMessage = newMessage.replace(/@.+/, '').trim();
    }

    try {
      if (userMessage) {
        await addDoc(messagesRef, {
          text: userMessage,
          createdAt: serverTimestamp(),
          imageUrl,
          userId,
          name,
          workspaceId,
        });
      }

      if (aiPrompt) {
        const aiResponse = await generateAIResponse(aiPrompt);
        await addDoc(messagesRef, {
          text: `🤖 ${aiResponse}`,
          createdAt: serverTimestamp(),
          imageUrl: "/ai-avatar.png",
          userId: "AI_BOT",
          name: "CodeBot",
          workspaceId,
        });
      }

      setNewMessage("");
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

  const MessageBubble = ({ msg }) => {
    const isCurrentUser = msg.userId === userId;
    const isAI = msg.userId === "AI_BOT";

    return (
      <div
        className={`flex flex-col gap-1 ${
          isCurrentUser ? "items-end" : 
          isAI ? "items-center" : "items-start"
        }`}
      >
        {!isAI && (
          <span className="text-xs text-gray-400">
            {isCurrentUser ? "You" : msg.name}
          </span>
        )}
        
        <div className="flex justify-end gap-2">
          {!isCurrentUser && !isAI && (
            <img
              src={msg.imageUrl}
              alt="Avatar"
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
          )}

          <div
            className={`py-2 px-4 text-sm rounded-2xl max-w-[80%] break-words ${
              isAI ? "bg-blue-900/40 border border-blue-800/50" :
              isCurrentUser 
                ? "bg-purple-600/40" 
                : "bg-gray-800/40"
            }`}
          >
            {isAI && <span className="text-blue-400 mr-2">⚡</span>}
            {msg.text}
            {isAI && (
              <div className="text-xs text-blue-400/70 mt-1">
                AI-generated response
              </div>
            )}
          </div>

          {isCurrentUser && !isAI && (
            <img
              src={msg.imageUrl}
              alt="Avatar"
              className="w-6 h-6 rounded-full flex-shrink-0"
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900/80 backdrop-blur-lg border border-gray-800 rounded-xl shadow-xl">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold text-gray-200">
          Workspace Chat
          <span className="text-blue-400 ml-2 text-sm">@AI</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={clearChat}
            className="px-3 py-1 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-400/30 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setIsChatOpen(false)}
            className="p-1.5 hover:bg-gray-800/50 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <p>No messages yet</p>
            <p className="text-xs mt-1 text-gray-600">
              Type @ followed by your question to ask AI
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {isAIProcessing && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-blue-400 text-sm py-2 px-4 rounded-full bg-blue-900/20">
              <div className="animate-spin">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z"/>
                </svg>
              </div>
              <span>CodeBot is generating response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800">
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
            placeholder="Type a message... Use @ to ask AI"
            className="flex-1 bg-gray-800/50 border border-gray-700 focus:border-gray-600 text-white placeholder-gray-500 rounded-xl backdrop-blur-sm"
          />
          <Button 
            type="submit" 
            disabled={isAIProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 transition-all"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Chatroom;