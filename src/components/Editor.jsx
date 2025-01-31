"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Editor, {useMonaco} from "@monaco-editor/react";
import axios from "axios";

export default function CodeEditor({ onChange, code, language }) {
  const [theme, setTheme] = useState("vs-dark");
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState(code);
  const [syntaxFix, setSyntaxFix] = useState("");
  const [isFixing, setIsFixing] = useState(false)
  const monaco = useMonaco();
  const timeoutRef = useRef(null);


  useEffect(() => {
    setUpdatedCode(code); // Reset when new code is provided
  }, [code]);

  useEffect(() => {
    if (!monaco) return;
    
    console.log("✅ Monaco is ready! Registering auto-complete...");

    monaco.languages.registerCompletionItemProvider(language || "javascript", {
      provideCompletionItems: async (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        console.log("🚀 Sending request to API with:", textUntilPosition);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        return new Promise((resolve) => {
          timeoutRef.current = setTimeout(async () => {
            try {
              const res = await axios.post("/api/auto-complete", { code: textUntilPosition });

              console.log("✅ API Response:", res.data);

              const suggestion = res.data.completedCode;

              if (!suggestion) return resolve({ suggestions: [] });

              resolve({
                suggestions: [
                  {
                    label: suggestion,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    insertText: suggestion,
                    documentation: "AI-generated auto-complete suggestion",
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    ),
                  },
                ],
              });
            } catch (error) {
              console.error("❌ Auto-complete error:", error);
              resolve({ suggestions: [] });
            }
          }, 300); // ✅ Debounce AI calls (wait 500ms)
        });
      },
    });

    monaco.editor.onDidCreateModel((model) => {
      console.log("📄 Editor Model Created:", model);
    });
  }, [monaco, language]); // ✅ Runs only when `monaco` or `language` changes


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

  const fixSyntaxErrors = async () => {
    setIsFixing(true);
    try {
      const res = await axios.post("/api/get-errors", { code: updatedCode, language });

      // If errors are found and AI fixes them
      if (res.data.fixedCode) {
        setSyntaxFix(res.data.fixedCode);
        setUpdatedCode(res.data.fixedCode); // Update the code with the fixed version
      } else if (res.data.errors) {
        setSyntaxFix("No syntax errors found.");
      }
    } catch (error) {
      console.error("Failed to fix syntax:", error);
      setSyntaxFix("Error fixing syntax.");
    } finally {
      setIsFixing(false);
    }
  };

  // const autoComplete = async () => {
  //   setIsAutoCompleting(true);
  //   try {
  //     const res = await axios.post("/api/auto-complete", { code: updatedCode});

  //     if (res.data.completedCode) {
  //       setUpdatedCode(res.data.completedCode); // Update the code with the fixed version
  //     } else if (res.data.errors) {
  //       setSyntaxFix("Invalid Input.");
  //     }
  //   } catch (error) {
  //     console.error("Failed to auto complete:", error);
  //   } finally {
  //     setIsAutoCompleting(false);
  //   }
  // };


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

        <button
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          onClick={fixSyntaxErrors}
          disabled={isFixing}
        >
          {isLoading ? "Fixing..." : "Fix Syntax"}
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
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
            bracketPairColorization: true,
            suggest: { preview: true },
          }}
        />
      </div>
    </>
  );
}
