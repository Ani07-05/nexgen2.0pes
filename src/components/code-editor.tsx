// leetcode-next/src/components/code-editor.tsx
import Editor from "@monaco-editor/react";
import { FC, useEffect } from "react";

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor: FC<CodeEditorProps> = ({ language, value, onChange }) => {
  // Map language names to Monaco Editor language IDs
  const getMonacoLanguage = (lang: string) => {
    const languageMap: { [key: string]: string } = {
      javascript: "javascript",
      python: "python",
      java: "java",
    };
    return languageMap[lang] || lang;
  };

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-border">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={value}
        theme="vs-dark"
        onChange={onChange}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          folding: true,
          lineNumbers: "on",
          wordWrap: "on",
          tabSize: 2,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
};

export default CodeEditor;
