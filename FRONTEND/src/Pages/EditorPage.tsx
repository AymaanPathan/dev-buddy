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
import {
  updateTranslation,
  clearTranslations,
  getTranslationHistory,
} from "../store/slice/translationSlice";
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Get translations and history from Redux store
  const translations = useSelector(
    (state: RootState) => state.translation.translations
  );
  const translationHistory = useSelector(
    (state: RootState) => state.translation.history
  );

  const [code, setCode] = useState("// Start coding together...\n");
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const editorRef = useRef<any>(null);
  const isUpdatingFromSocket = useRef(false);

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  // Refs for debouncing and tracking
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCommentsRef = useRef<Comment[]>([]);
  const hasLoadedHistory = useRef(false);

  console.log("📝 EditorPage rendered", {
    translationCount: Object.keys(translations).length,
    historyCount: translationHistory.length,
  });

  // Initialize socket connection and load history
  useEffect(() => {
    let finalUser = user;
    let finalRoomId = roomId;

    // 1) Restore user + room from localStorage
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

    // 3) Load translation history
    if (!hasLoadedHistory.current && finalUser.clientId) {
      console.log("📚 Loading translation history...");
      dispatch(
        getTranslationHistory({
          roomId: finalRoomId,
          clientId: finalUser.clientId,
        })
      );
      hasLoadedHistory.current = true;
    }

    // 4) Connect socket
    connectSocket();

    // 5) Join room
    joinRoom(
      finalRoomId,
      finalUser.name,
      finalUser.language,
      finalUser.clientId
    );

    // 6) Socket listeners
    onRoomUsersList((list) => dispatch(setUsers(list)));

    onInitialCode((initial) => {
      isUpdatingFromSocket.current = true;
      setCode(initial || "// Start coding together...\n");
    });

    onCodeUpdate((data) => {
      isUpdatingFromSocket.current = true;
      setCode(typeof data === "string" ? data : data.code);
    });

    onUserJoined((data) => {
      console.log("👋 User joined:", data);
      dispatch(addUser(data));
    });

    onUserLeft((data) => {
      console.log("👋 User left:", data);
      dispatch(removeUser(data.socketId));
    });

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
        const comment = lastCommentsRef.current[data.index];

        // Dispatch to Redux with both line and original text
        dispatch(
          updateTranslation({
            line: comment.line,
            text: data.translatedText,
            originalText: comment.text,
          })
        );
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
  }, [roomId, user, dispatch]);

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
        dispatch(clearTranslations());
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
    }, 1000);
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

  // Get active comments with translations
  const activeTranslations = lastCommentsRef.current
    .map((comment) => ({
      ...comment,
      translation: translations[comment.line],
    }))
    .filter((item) => item.translation);

  const translationCount = activeTranslations.length;

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
          user={user ? { ...user, roomId } : null}
          translations={translations}
          isTranslating={isTranslating}
          translationProgress={translationProgress}
          setIsHistoryOpen={setIsHistoryOpen}
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
          {!isHistoryOpen && (
            <AnimatePresence>
              {translationCount > 0 && (
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
                          {translationCount} active
                        </span>
                      </div>
                    </h3>
                    <button
                      onClick={() => dispatch(clearTranslations())}
                      className="text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 p-2 rounded-lg"
                      title="Clear current translations"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="max-h-[65vh] overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <AnimatePresence mode="popLayout">
                      {activeTranslations.map((item, idx) => (
                        <motion.div
                          key={`${item.line}-${idx}`}
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
                                LINE {item.line + 1}
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
                              {item.text}
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
                              {item.translation}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* History view when sidebar is open */}
          {isHistoryOpen && (
            <div className="absolute top-6 right-6 w-96 bg-[#1e1e1e] backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-white/90 font-medium text-sm">
                    Translation History
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {translationHistory.length} total translations
                  </p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200 p-2 rounded-lg"
                  title="Clear current translations"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="max-h-[65vh] overflow-y-auto px-4 py-3 space-y-2">
                {translationHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No translation history yet
                  </p>
                ) : (
                  <AnimatePresence>
                    {translationHistory.map((item, idx) => (
                      <motion.div
                        key={`history-${idx}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 bg-white/[0.02] border border-white/5 rounded-lg"
                      >
                        <div className="text-xs text-gray-500 mb-2">
                          Line {item.line + 1}
                        </div>
                        <div className="text-sm text-gray-300 mb-1">
                          {item.originalText}
                        </div>
                        <div className="text-sm text-violet-200">
                          {item.translatedText}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>
          )}

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
