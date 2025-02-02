"use client";

import { useEffect, useState } from "react";
import { db } from "@/config/firebase";
import { doc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { useAuth } from "@/context/AuthProvider";

const LiveCursor = ({ workspaceId }) => {
  const { user } = useAuth();
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    if (!user) return;

    const handleMouseMove = async (event) => {
      const { clientX, clientY } = event;

      const cursorRef = doc(db, `workspaces/${workspaceId}/cursors`, user.uid);
      await setDoc(
        cursorRef,
        {
          x: clientX,
          y: clientY,
          displayName: user.displayName || "Anonymous",
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
        },
        { merge: true }
      );
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [user, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const cursorsRef = collection(db, `workspaces/${workspaceId}/cursors`);
    const unsubscribe = onSnapshot(cursorsRef, (snapshot) => {
      const cursorsData = {};
      snapshot.forEach((doc) => {
        cursorsData[doc.id] = doc.data();
      });
      setCursors(cursorsData);
    });

    return () => unsubscribe();
  }, [workspaceId]);

  return (
    <div>
      {Object.entries(cursors).map(([userId, cursor]) =>
        userId !== user?.uid && cursor ? (
          <div
            key={userId}
            className="absolute w-4 h-4 rounded-full opacity-80 transition-all duration-100"
            style={{
              left: cursor?.x || 0, // Fallback to 0 if undefined
              top: cursor?.y || 0, // Fallback to 0 if undefined
              backgroundColor: cursor?.color || "#ffffff", // Default color
            }}
          >
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs bg-gray-700 text-white px-2 py-1 rounded">
              {cursor?.displayName || "Anonymous"}
            </span>
          </div>
        ) : null
      )}
    </div>
  );
};

export default LiveCursor;
