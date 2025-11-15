/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/EditorPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";

import { Languages, X } from "lucide-react";
import type { RootDispatch, RootState } from "../store";
import {
  connectSocket,
  disconnectSocket,
  emitCodeChange,
  emitCursorMove,
  joinRoom,
  onCodeUpdate,
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
import {
  addUser,
  removeUser,
  setRoom,
  setUser,
  setUsers,
} from "../store/slice/roomSlice";
import { extractComments, type Comment } from "../utils/commentDetector";
import { getLanguageCode } from "../utils/getLanCode.utils";
import { Header } from "../components/EditorPageComponents/Header";
import { Sidebar } from "../components/EditorPageComponents/Sidebar";

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
  const translationTimeoutRef = useRef(null);
  const lastCommentsRef = useRef<Comment[]>([]);

  console.log("📝 EditorPage rendered", cursors);

  // Initialize socket connection
  useEffect(() => {
    let finalUser = user;
    let finalRoomId = roomId;

    // 1) Restore user + room from localStorage before redirect
    const savedUser = localStorage.getItem("lingo_user");
    const savedRoom = localStorage.getItem("lingo_room");

    if (!finalUser && savedUser) {
      finalUser = JSON.parse(savedUser);
      dispatch(setUser(finalUser));
    }

    if (!finalRoomId && savedRoom) {
      finalRoomId = savedRoom;
      dispatch(setRoom(finalRoomId));
    }

    // After restoring, if still missing something → redirect home
    if (!finalUser || !finalRoomId) {
      navigate("/");
      return;
    }

    console.log("🚀 Restored session:", finalUser.name);

    // 2) Load cached code only for this room
    const cached = localStorage.getItem(`lingo_code_${finalRoomId}`);
    if (cached) setCode(cached);

    // 3) Connect socket ONCE
    connectSocket();

    // 4) Join room ONCE (using restored session)
    joinRoom(
      finalRoomId,
      finalUser.name,
      finalUser.language,
      finalUser.clientId
    );

    // 5) All your socket listeners...
    onRoomUsersList((list) => dispatch(setUsers(list)));
    onInitialCode((initial) => {
      isUpdatingFromSocket.current = true;
      setCode(initial || "// Start coding together...\n");
    });

    onCodeUpdate((data) => {
      isUpdatingFromSocket.current = true;
      setCode(typeof data === "string" ? data : data.code);
    });

    // ... other listeners (cursor, user joined, left)

    // Cleanup
    return () => {
      removeAllListeners();
      removeTranslationListeners();
      disconnectSocket();
    };
  }, [roomId, user, dispatch, navigate]);

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
        emitTranslateBatch(
          commentTexts,
          targetLang,
          "auto",
          roomId,
          user?.clientId
        );
      }
    }, 1000); // Wait 1 second after user stops typing
  };

  // Handle code changes
  const handleCodeChange = (value: string | undefined) => {
    if (!value || isUpdatingFromSocket.current) {
      isUpdatingFromSocket.current = false;
      return;
    }
    localStorage.setItem(`lingo_code_${roomId}`, value || "");

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

  return (
    <div className="h-screen bg-[#191919] flex flex-col">
      <Header
        roomId={roomId!}
        users={users}
        isTranslating={isTranslating}
        translationProgress={translationProgress}
      />

      {/* Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          users={users}
          user={user}
          translations={translations}
          isTranslating={isTranslating}
          translationProgress={translationProgress}
        />

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
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="absolute top-6 right-6 w-96 bg-[#1e1e1e] backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                  <h3 className="text-white/90 font-medium flex items-center gap-2.5 text-sm tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Languages className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex flex-col">
                      <span>Live Translations</span>
                      <span className="text-[11px] text-gray-500 font-normal">
                        {translations.size} active
                      </span>
                    </div>
                  </h3>
                  <button
                    onClick={() => setTranslations(new Map())}
                    className="text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 p-2 rounded-lg"
                    title="Clear all translations"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="max-h-[65vh] overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                  <AnimatePresence mode="popLayout">
                    {lastCommentsRef.current.map((comment, idx) => {
                      const translation = translations.get(comment.line);
                      if (!translation) return null;

                      return (
                        <motion.div
                          key={idx}
                          layout
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{
                            delay: idx * 0.03,
                            type: "spring",
                            damping: 25,
                            stiffness: 400,
                          }}
                          className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all duration-200 cursor-default"
                        >
                          {/* Line number badge */}
                          <div className="flex items-center gap-2 mb-3">
                            <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5">
                              <span className="text-gray-500 font-mono text-[10px] font-medium tracking-wider">
                                LINE {comment.line + 1}
                              </span>
                            </div>
                          </div>

                          {/* Original text */}
                          <div className="mb-3 space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                              <span className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">
                                Original
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed pl-3">
                              {comment.text}
                            </p>
                          </div>

                          {/* Translation */}
                          <div className="space-y-1.5 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-violet-500"></div>
                              <span className="text-violet-400 text-[10px] font-medium uppercase tracking-widest">
                                Translation
                              </span>
                            </div>
                            <p className="text-violet-200 text-sm leading-relaxed pl-3 font-medium">
                              {translation}
                            </p>
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
