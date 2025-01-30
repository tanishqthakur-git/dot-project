"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";

export default function CodeEditor({ onChange, code }) {
  const [theme, setTheme] = useState("vs-dark");

  return (
    <div className="editor-container">
      <button onClick={() => setTheme(theme === "vs-dark" ? "light" : "vs-dark")}>
        Toggle Theme
      </button>
      <Editor
        height="500px"
        theme={theme}
        defaultLanguage="javascript"
        defaultValue={code}
        onChange={onChange}
        options={{
          wordWrap: "on",
          minimap: { enabled: false },
          bracketPairColorization: true,
        }}
      />
    </div>
  );
}
