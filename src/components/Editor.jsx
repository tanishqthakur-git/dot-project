"use client";
import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

export default function CodeEditor({ onChange, code, language }) {
  const editorRef = useRef(null);

  const [theme, setTheme] = useState("vs-dark");
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState(code);

  useEffect(() => {
    setUpdatedCode(code); // Reset when new code is provided
  }, [code]);

  // Generate documentation and append as comments
  const generateDocs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/generate-documentation", { code: updatedCode });
      const documentation = res.data.documentation;

      // Append documentation as comments at the end of the file
      const commentedDocs = `\n\n${documentation}`;
      setUpdatedCode((prevCode) => prevCode + commentedDocs);
      onChange(updatedCode + commentedDocs); // Update parent state if necessary
    } catch (error) {
      console.error("Failed to generate documentation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  }

  return (
    <>
      {/* Controls Section */}
      <div className="flex gap-4 mb-4">
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}
        >
          Toggle Theme
        </button>
        <button
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          onClick={generateDocs}
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Docs"}
        </button>
      </div>

      {/* Code Editor */}
      <div className="editor-container">
        <Editor
          height="500px"
          theme={theme}
          defaultLanguage={language || "javascript"}
          value={updatedCode}
          onChange={(value) => setUpdatedCode(value)}
          onMount={onMount}
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
            bracketPairColorization: true,
          }}
        />
      </div>
    </>
  );
}
