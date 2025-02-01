"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import axios from "axios";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "@/constants";
import { Box, HStack } from "@chakra-ui/react";
import Output from "./Output";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

export default function CodeEditor({ file }) {
  const [theme, setTheme] = useState("vs-dark");
  const [isLoading, setIsLoading] = useState(false);
  const [updatedCode, setUpdatedCode] = useState("");
  const [syntaxFix, setSyntaxFix] = useState("");
  const [isFixing, setIsFixing] = useState(false)
  const monaco = useMonaco();
  const timeoutRef = useRef(null);
  const lastApiCallRef = useRef(0);
  const [codeLanguage, setcodeLanguage] = useState('javascript')
  const editorRef = useRef();

  useEffect(() => {
    if (file) {
      fetchFileContent();
    }
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
    timeoutRef.current = setTimeout(() => autoSaveFile(value), 2000);
  };


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
    setcodeLanguage(codeLanguage)
    setUpdatedCode(
      CODE_SNIPPETS[codeLanguage]
    )
  }

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };



  // useEffect(() => {
  //   if (!monaco || !editorRef.current) return;

  //   console.log("✅ Monaco is ready! Registering auto-complete...");

  //   const providerRef =  monaco.languages.registerInlineCompletionsProvider(codeLanguage, {
  //     provideInlineCompletions: async (model, position) => {
  //       const textUntilPosition = model.getValueInRange({
  //         startLineNumber: 1,
  //         startColumn: 1,
  //         endLineNumber: position.lineNumber,
  //         endColumn: position.column,
  //       });

  //       const currentTime = Date.now();
  //       if (currentTime - lastApiCallRef.current < 1000) return { items: [] };
  //       lastApiCallRef.current = currentTime;
  //       console.log("hello");
        

  //       if (timeoutRef.current) clearTimeout(timeoutRef.current);

  //       return new Promise((resolve) => {
  //         timeoutRef.current = setTimeout(async () => {
  //           try {
  //             const res = await axios.post("/api/auto-complete", { code: textUntilPosition, language: codeLanguage });
  //             let suggestion = res.data.completedCode?.trim();
  //             if (!suggestion) return resolve({ items: [] });

  //             suggestion = suggestion.replace(/```[\s\S]*?\n([\s\S]*?)```/, "$1");
  //             console.log(suggestion);
              

  //             const currentLine = model.getLineContent(position.lineNumber);

  //             resolve({
  //               items: [
  //                 {
  //                   insertText: suggestion,
  //                   range: new monaco.Range(
  //                     position.lineNumber,
  //                     1,
  //                     position.lineNumber,
  //                     currentLine.length + 1
  //                   ),
  //                   insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
  //                 },
  //               ],
  //             });

  //            if (editorRef.current) {
  //             setTimeout(() => {
  //               editorRef.current.trigger("keyboard", "editor.action.inlineSuggest.trigger", {});
  //             }, 10);
  //           }
              
  //           } catch (error) {
  //             console.error("❌ Auto-complete error:", error);
  //             resolve({ items: [] });
  //           }
  //         }, 300);
  //       });
  //     },
  //   });

  //   const editor = editorRef.current;
  // const keyListener = editor.onKeyDown((e) => {
  //   if (e.keyCode === monaco.KeyCode.Enter) {
  //     // ⬇️ Check if default suggestions are open
  //     const suggestWidgetVisible = editor.getContribution("editor.contrib.suggestController").widget.value?.isVisible();
  //     if (!suggestWidgetVisible) {
  //       // ⬇️ If no default suggestion, hide inline suggestions
  //       setTimeout(() => {
  //         editor.trigger("keyboard", "editor.action.inlineSuggest.hide", {});
  //       }, 50);
  //     }
  //   }

  //   if (e.keyCode === monaco.KeyCode.Tab) {
  //     // ⬇️ Accept inline AI suggestion when pressing Tab
  //     editor.trigger("keyboard", "editor.action.inlineSuggest.commit", {});
  //     e.preventDefault(); // Stop Tab from adding indentation
  //   }
  // });

  // // ✅ Cleanup: Dispose provider and key listener
  // return () => {
  //   providerRef.dispose();
  //   keyListener.dispose();
  // };
  // }, [monaco, codeLanguage, updatedCode]);





  // Generate documentation and append as comments
  const generateDocs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post("/api/generate-documentation", { code: updatedCode, language: codeLanguage });
      const documentation = res.data.documentation;
      console.log("Documentation: ", documentation);
      

      // Append documentation as comments at the end of the file
      const commentedDocs = `\n\n${documentation}`;
      setUpdatedCode((prevCode) => prevCode + commentedDocs);
      //onChange(updatedCode + commentedDocs); // Update parent state if necessary
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
          {isFixing ? "Fixing..." : "Fix Syntax"}
        </button>
      </div>

       {/* Current File Display */}
       {file && (
        <div className="bg-gray-800 text-white px-4 py-2 rounded flex items-center justify-between w-full mb-2">
          <span className="text-sm">📝 Editing: {file.name}</span>
        </div>
      )}


      {/* Code Editor */}
      <Box>
        <HStack spacing={4}>
          <Box w="50%">
            <LanguageSelector language={codeLanguage} onSelect={onSelect} />
            <Editor
              height="500px"
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
                  showToolbar: 'onHover',
                  mode: 'subword',
                  suppressSuggestions: false,
                },
                quickSuggestions: { other: true, comments: false, strings: true },
                suggestSelection:"recentlyUsed",
              }}
            />
          </Box>
          <Output editorRef={editorRef} language={codeLanguage} />
        </HStack>
      </Box>
    </>
  );
}
