"use client";
import { Moon, Sun, FileText, Sparkles, Wrench } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "@/constants";
import { Box, HStack } from "@chakra-ui/react";
import Output from "./Output";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function CodeEditor({ file }) {
  const [theme, setTheme] = useState("vs-dark");
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState("");
  const [isFixing, setIsFixing] = useState(false);
  const monaco = useMonaco();
  const timeoutRef = useRef(null);
  const editorRef = useRef();
  const [codeLanguage, setCodeLanguage] = useState("javascript");

  useEffect(() => {
    if (file) {
      fetchFileContent();
    }
  }, [file]);

  // Real-time syncing listener
  useEffect(() => {
    if (!file?.id || !file?.workspaceId) return;

    const filePath = `workspaces/${file.workspaceId}/files`;
    const fileRef = doc(db, filePath, file.id);

    // Listening to Firestore updates in real-time
    const unsubscribe = onSnapshot(fileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.content !== updatedCode) {
          setUpdatedCode(data.content || "");
        }
      }
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, [file]);

  const fetchFileContent = async () => {
    if (!file?.id || !file?.workspaceId) return;
    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      const fileSnap = await getDoc(fileRef);

      console.log("✅ Fetched file content:", fileSnap.data());

      if (fileSnap.exists()) {
        setUpdatedCode(fileSnap.data().content || "");
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  };

  const handleEditorChange = (value) => {
    setUpdatedCode(value);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => autoSaveFile(value), 0);
  };

  // Auto-save file content
  const autoSaveFile = async (content) => {
    if (!file?.id || !file?.workspaceId) return;

    console.log("🚀 Auto-saving file...");

    try {
      const filePath = `workspaces/${file.workspaceId}/files`;
      const fileRef = doc(db, filePath, file.id);
      await updateDoc(fileRef, { content });

      console.log("✅ Auto-saved file:", file.name);
    } catch (error) {
      console.error("Error auto-saving file:", error);
    }
  };

  const onSelect = (codeLanguage) => {
    setCodeLanguage(codeLanguage);
    setUpdatedCode(CODE_SNIPPETS[codeLanguage]);
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const generateDocs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/generate-documentation", { code: updatedCode, language: codeLanguage });
      const documentation = res.data.documentation;
      console.log("Documentation: ", documentation);

      const commentedDocs = `\n\n${documentation}`;
      setUpdatedCode((prevCode) => prevCode + commentedDocs);
    } catch (error) {
      console.error("Failed to generate documentation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fixSyntaxErrors = async () => {
    setIsFixing(true);
    try {
      const res = await axios.post("/api/get-errors", { code: updatedCode, codeLanguage });

      if (res.data.fixedCode) {
        setUpdatedCode(res.data.fixedCode);
      }
    } catch (error) {
      console.error("Failed to fix syntax:", error);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="mt-6">
      <Box className="relative" >
        <div className="flex">
          <Box w="76%" >
            <div className="flex justify-between pr-12 pb-4 ">
              {file && (
                  <div className="flex items-center bg-gray-900 text-white px-4 py-2 rounded-md shadow-md border border-gray-700 w-40">
                    <FileText size={16} className="mr-2 text-gray-400" />
                    <span className="text-sm text-gray-300 line-clamp-1">{file.name}</span>
                  </div>
                )}
                 <div className="flex gap-4">
                    <button
                      className="flex text-sm  items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-full shadow-md hover:bg-gray-700 transition ring-1 ring-gray-600 bg-opacity-40" 
                      onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
                    >
                      {theme === "vs-dark" ? <Sun size={16} /> : <Moon size={16} />} Theme
                    </button>
                    <button
                      className="flex text-sm  items-center gap-2 bg-blue-700 bg-opacity-20 ring-1 ring-blue-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-600 transition disabled:opacity-50"
                      onClick={generateDocs}
                      disabled={isLoading}
                    >
                      <Sparkles size={16} /> {isLoading ? "Generating..." : "Generate Docs"}
                    </button>
                    <button
                      className="flex text-sm  items-center gap-2 bg-teal-600 bg-opacity-20 ring-1 ring-teal-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-teal-600 transition disabled:opacity-50"
                      onClick={fixSyntaxErrors}
                      disabled={isFixing}
                    >
                      <Wrench size={16} /> {isFixing ? "Fixing..." : "Fix Syntax"}
                    </button>
                </div>
               <LanguageSelector language={codeLanguage} onSelect={onSelect} />
            </div>
            <Editor
              height="515px"
              theme={theme}
              language={codeLanguage}
              defaultValue={CODE_SNIPPETS[codeLanguage]}
              value={updatedCode}
              onMount={onMount}
              onChange={handleEditorChange}
              options={{
                wordWrap: "on",
                minimap: { enabled: false },
                bracketPairColorization: true,
                suggest: { preview: true },
                inlineSuggest: {
                  enabled: true,
                  showToolbar: "onHover",
                  mode: "subword",
                  suppressSuggestions: false,
                },
                quickSuggestions: { other: true, comments: true, strings: true },
                suggestSelection: "recentlyUsed",
              }}
            />
          </Box>
          <Output editorRef={editorRef} language={codeLanguage} />
        </div>
      </Box>
    </div>
  );
}
