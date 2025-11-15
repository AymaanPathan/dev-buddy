/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/EditorPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";

import { Users, MessageSquare, Languages, X, Sparkles } from "lucide-react";
import type { RootDispatch, RootState } from "../store";
import {
  connectSocket,
  disconnectSocket,
  emitCodeChange,
  emitCursorMove,
  joinRoom,
  onCodeUpdate,
  onCursorUpdate,
  onInitialCode,
  onUserJoined,
  onUserLeft,
  onRoomUsersList,
  removeAllListeners,
  getSocketId,
  emitTranslateBatch,
  onTranslateStart,
  onTranslateChunk,
  onTranslateComplete,
  onTranslateError,
  removeTranslationListeners,
} from "../services/socket";
import { addUser, removeUser, setUsers } from "../store/slice/roomSlice";
import {
  extractComments,
  logComments,
  replaceCommentsWithTranslations,
  type Comment,
} from "../utils/commentDetector";
import { getLanguageCode } from "../utils/getLanCode.utils";

interface Cursor {
  socketId: string;
  name: string;
  cursor: { line: number; column: number };
}

const EditorPage = () => {
  const dispatch: RootDispatch = useDispatch();
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.room);
  const users = useSelector((state: RootState) => state.room.users);
  const [code, setCode] = useState("// Start coding together...\n");
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const editorRef = useRef<any>(null);
  const isUpdatingFromSocket = useRef(false);

  // Translation state
  const [translations, setTranslations] = useState<Map<number, string>>(
    new Map()
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  // Refs for debouncing
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCommentsRef = useRef<Comment[]>([]);

  console.log("📝 EditorPage rendered", cursors);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !user) {
      navigate("/");
      return;
    }

    console.log("🚀 EditorPage: Initializing for user", user.name);

    connectSocket();

    // Join room
    joinRoom(roomId, user.name, user.language);

    // Handle initial users list
    onRoomUsersList((usersList) => {
      console.log("📋 Received initial users list:", usersList);
      dispatch(setUsers(usersList));
    });

    // Handle initial code
    onInitialCode((initialCode) => {
      console.log("📝 Received initial code");
      isUpdatingFromSocket.current = true;
      setCode(initialCode || "// Start coding together...\n");
    });

    // Handle code updates from other users
    onCodeUpdate(async (rawData: any) => {
      isUpdatingFromSocket.current = true;

      const data =
        typeof rawData === "string"
          ? { code: rawData, language: "javascript" }
          : rawData;

      setCode(data.code);
    });

    onCursorUpdate((data) => {
      const mySocketId = getSocketId();

      if (data.socketId === mySocketId) {
        return;
      }

      setCursors((prev) => {
        const filtered = prev.filter((c) => c.socketId !== data.socketId);
        return [...filtered, data];
      });

      setTimeout(() => {
        setCursors((prev) => prev.filter((c) => c.socketId !== data.socketId));
      }, 5000);
    });

    // Handle user joined
    onUserJoined((data) => {
      console.log(`👋 ${data.name} joined (${data.language})`);
      dispatch(addUser(data));
    });

    // Handle user left
    onUserLeft((data) => {
      console.log(`👋 ${data.name} left`);
      dispatch(removeUser({ name: data.name }));
      setCursors((prev) => prev.filter((c) => c.name !== data.name));
    });

    return () => {
      removeAllListeners();
      removeTranslationListeners();
      disconnectSocket();
      if (translationTimeoutRef.current) {
        clearTimeout(translationTimeoutRef.current);
      }
    };
  }, [roomId, user, navigate, dispatch]);

  // Set up real-time translation listeners
  useEffect(() => {
    if (!roomId || !user) return;

    // Set up socket listeners for real-time translation
    onTranslateStart((data) => {
      console.log(`🚀 Translation started: ${data.total} texts`);
      setIsTranslating(true);
      setTranslationProgress(0);
    });

    onTranslateChunk((data) => {
      console.log(
        `📦 Received chunk ${data.index + 1} (${data.progress}% complete)`
      );

      setTranslationProgress(data.progress);

      if (data.success && lastCommentsRef.current[data.index]) {
        setTranslations((prev) => {
          const newMap = new Map(prev);
          newMap.set(
            lastCommentsRef.current[data.index].line,
            data.translatedText
          );
          return newMap;
        });
      }
    });

    onTranslateComplete((data) => {
      console.log(`✅ Translation complete! ${data.total} texts translated.`);
      setIsTranslating(false);
      setTranslationProgress(100);

      // Reset progress after 2 seconds
      setTimeout(() => setTranslationProgress(0), 2000);
    });

    onTranslateError((data) => {
      console.error("Translation error:", data);
      setIsTranslating(false);
      setTranslationProgress(0);
    });

    return () => {
      removeTranslationListeners();
    };
  }, [roomId, user]);

  // Auto-translate comments when code changes
  const autoTranslateComments = (currentCode: string) => {
    // Clear previous timeout
    if (translationTimeoutRef.current) {
      clearTimeout(translationTimeoutRef.current);
    }

    // Debounce translation by 1 second
    translationTimeoutRef.current = setTimeout(() => {
      const language = user?.language || "javascript";
      const comments = extractComments(currentCode, language);

      // Only translate if there are comments
      if (comments.length === 0) {
        setTranslations(new Map());
        lastCommentsRef.current = [];
        return;
      }

      console.log(`🔍 Auto-detecting ${comments.length} comments...`);
      lastCommentsRef.current = comments;

      const commentTexts = comments.map((c) => c.text);
      const targetLang = getLanguageCode(user?.language || "javascript");

      // Emit translation request via Socket.IO
      if (roomId) {
        emitTranslateBatch(commentTexts, targetLang, "auto", roomId);
      }
    }, 1000); // Wait 1 second after user stops typing
  };

  // Handle code changes
  const handleCodeChange = (value: string | undefined) => {
    if (!value || isUpdatingFromSocket.current) {
      isUpdatingFromSocket.current = false;
      return;
    }

    setCode(value);
    if (roomId && user) {
      emitCodeChange(roomId, value, user.language);
    }

    // Auto-translate comments
    autoTranslateComments(value);
  };

  // Handle cursor position changes
  const handleCursorChange = (e: any) => {
    if (isUpdatingFromSocket.current || !roomId || !user) {
      return;
    }

    const position = e.position;
    emitCursorMove(roomId, {
      line: position.lineNumber,
      column: position.column,
    });
  };

  // Get translated line for display
  const getTranslatedLine = (lineNumber: number): string | null => {
    return translations.get(lineNumber - 1) || null;
  };

  return (
    <div className="h-screen bg-[#191919] flex flex-col">
      {/* Notion-style Header */}
      <header className="h-[52px] bg-[#202020]/80 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="text-white/95 font-semibold text-[15px] tracking-tight">
              CodeBridge
            </h1>
          </div>
          <div className="text-[13px] text-gray-400">
            <span className="text-gray-500">Room:</span>{" "}
            <span className="font-mono text-gray-300">{roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active users */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#191919]/60 rounded-md border border-white/[0.08] hover:border-white/[0.12] transition-colors">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[13px] text-gray-300 font-medium">
              {users.length + 1}
            </span>
          </div>

          {/* Auto-translate indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-violet-500/[0.08] border border-violet-500/[0.15] rounded-md">
            <Languages className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[13px] text-violet-300 font-medium">
              Auto-translate
            </span>
          </div>

          {/* Translation status */}
          <AnimatePresence>
            {isTranslating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-[#191919]/60 rounded-md border border-white/[0.08]"
              >
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                <span className="text-[12px] text-gray-300 font-medium">
                  {translationProgress}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Notion-style Sidebar */}
        <aside className="w-64 bg-[#202020]/80 backdrop-blur-sm border-r border-white/[0.08] p-4 overflow-y-auto">
          <h3 className="text-[13px] font-semibold text-gray-300 mb-3 tracking-tight">
            Active Users ({users.length + 1})
          </h3>
          <div className="space-y-2">
            {/* Current user */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 bg-blue-500/[0.08] border border-blue-500/[0.15] rounded-lg transition-all duration-200 hover:border-blue-500/[0.25]"
            >
              <div className="font-medium text-[13px] text-white/95 mb-0.5">
                {user?.name}{" "}
                <span className="text-blue-400 text-[12px]">(You)</span>
              </div>
              <div className="text-[12px] text-gray-400">{user?.language}</div>
            </motion.div>

            {/* Other users */}
            <AnimatePresence>
              {users.map((u, idx) => {
                return (
                  <motion.div
                    key={`${u.name}-${idx}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-2.5 bg-[#191919]/60 border border-white/[0.08] rounded-lg transition-all duration-200 hover:border-white/[0.12] hover:bg-[#1c1c1c]"
                  >
                    <div className="font-medium text-[13px] text-white/95 mb-0.5">
                      {u.name}
                    </div>
                    <div className="text-[12px] text-gray-400">
                      {u.language}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {users.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-[13px]">
                No other users yet
              </div>
            )}
          </div>

          {/* Translation info */}
          <AnimatePresence>
            {translations.size > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 pt-5 border-t border-white/[0.06]"
              >
                <h3 className="text-[13px] font-semibold text-gray-300 mb-2 tracking-tight flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" />
                  Live Translations
                </h3>
                <div className="text-[12px] text-gray-400 mb-1">
                  {translations.size} comment(s) translated
                </div>
                <div className="text-[12px] text-violet-400">
                  Updates automatically
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar */}
          <AnimatePresence>
            {isTranslating && translationProgress > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 pt-5 border-t border-white/[0.06]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] text-gray-400 font-medium">
                    Translation Progress
                  </span>
                  <span className="text-[12px] text-violet-400 font-mono">
                    {translationProgress}%
                  </span>
                </div>
                <div className="w-full bg-[#191919] rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${translationProgress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="bg-gradient-to-r from-violet-500 to-purple-500 h-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* Editor */}
        <main className="flex-1 relative bg-[#1e1e1e]">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            onMount={(editor) => {
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
                className="absolute top-4 right-4 w-80 bg-[#202020]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-4 max-h-[60vh] overflow-y-auto shadow-2xl shadow-black/40"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white/95 font-semibold flex items-center gap-2 text-[13px] tracking-tight">
                    <Languages className="w-4 h-4 text-violet-400" />
                    Live Translations ({translations.size})
                  </h3>
                  <button
                    onClick={() => setTranslations(new Map())}
                    className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-md hover:bg-white/[0.06]"
                    title="Clear translations"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {lastCommentsRef.current.map((comment, idx) => {
                      const translation = translations.get(comment.line);
                      if (!translation) return null;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-[#191919]/60 rounded-lg p-3 text-[12px] border border-white/[0.06] hover:border-white/[0.1] transition-colors"
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
                    className="px-3 py-1.5 bg-violet-500/[0.12] border border-violet-500/[0.2] rounded-lg text-[12px] text-violet-300 font-medium backdrop-blur-sm shadow-lg"
                  >
                    {c.name} is typing...
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
