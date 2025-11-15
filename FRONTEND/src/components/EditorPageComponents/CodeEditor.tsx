/* eslint-disable @typescript-eslint/no-explicit-any */
import { Editor } from "@monaco-editor/react";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, X } from "lucide-react";
import React from "react";

interface EditorProps {
  code: string;
  handleCodeChange: (value: string | undefined) => void;
  handleCursorChange: (e: any) => void;
  editorRef: React.MutableRefObject<any>;
  translations: Map<number, string>;
  setTranslations: React.Dispatch<React.SetStateAction<Map<number, string>>>;
  lastComments: Array<{ line: number; text: string }>;
  cursors: Array<{ name: string; socketId?: string }>;
}

export const CodeEditor: React.FC<EditorProps> = ({
  code,
  handleCodeChange,
  handleCursorChange,
  editorRef,
  translations,
  setTranslations,
  lastComments,
  cursors,
}) => {
  return (
    <main className="flex-1 relative bg-[#1e1e1e]">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={handleCodeChange}
        onMount={(editor: any) => {
          editorRef.current = editor;
          editor.onDidChangeCursorPosition(handleCursorChange);
        }}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineHeight: 1.6,
        }}
      />

      {/* Floating translation panel - Notion-style */}
      <AnimatePresence>
        {translations.size > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: -20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-4 right-4 w-80 bg-[#202020]/95 backdrop-blur-xl border border-white/8 rounded-xl p-4 max-h-[60vh] overflow-y-auto shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white/95 font-semibold flex items-center gap-2 text-[13px] tracking-tight">
                <Languages className="w-4 h-4 text-violet-400" />
                Live Translations ({translations.size})
              </h3>
              <button
                onClick={() => setTranslations(new Map())}
                className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-md hover:bg-white/6"
                title="Clear translations"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              <AnimatePresence>
                {lastComments.map((comment, idx) => {
                  const translation = translations.get(comment.line);
                  if (!translation) return null;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-[#191919]/60 rounded-lg p-3 text-[12px] border border-white/6 hover:border-white/10 transition-colors"
                    >
                      <div className="text-gray-500 mb-1.5 font-mono text-[11px]">
                        Line {comment.line + 1}
                      </div>
                      <div className="text-gray-300 mb-2 leading-relaxed">
                        <span className="text-gray-500 text-[11px] uppercase tracking-wide">
                          Original:
                        </span>
                        <div className="mt-0.5">"{comment.text}"</div>
                      </div>
                      <div className="text-violet-300 leading-relaxed">
                        <span className="text-violet-500 text-[11px] uppercase tracking-wide">
                          → Translation:
                        </span>
                        <div className="mt-0.5">"{translation}"</div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cursor indicators - Notion-style */}
      <AnimatePresence>
        {cursors.length > 0 && (
          <div className="absolute top-4 left-4 space-y-2">
            {cursors.map((c) => (
              <motion.div
                key={c.socketId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="px-3 py-1.5 bg-violet-500/12 border border-violet-500/20  rounded-lg text-[12px] text-violet-300 font-medium backdrop-blur-sm shadow-lg"
              >
                {c.name} is typing...
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
