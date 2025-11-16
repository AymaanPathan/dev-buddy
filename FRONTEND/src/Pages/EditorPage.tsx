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
  removeAllListeners,
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
import { Header } from "../components/EditorPageComponents/Header";
import { Sidebar } from "../components/EditorPageComponents/Sidebar";
import { setComments } from "../store/slice/commentSlice";

interface Cursor {
  socketId: string;
  name: string;
  cursor: { line: number; column: number };
}

interface ActiveTranslation {
  line: number;
  text: string;
  translation: string;
}

const EditorPage = () => {
  const dispatch: RootDispatch = useDispatch();
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.room);
  const users = useSelector((state: RootState) => state.room.users);
  const translations = useSelector(
    (state: RootState) => state.translation.translations
  );

  const [code, setCode] = useState("");
  const editorRef = useRef<any>(null);
  const isUpdatingFromSocket = useRef(false);
  const lastCommentsRef = useRef<Comment[]>([]);
  const hasLoadedHistory = useRef(false);
  const translationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [activeTranslations, setActiveTranslations] = useState<
    ActiveTranslation[]
  >([]);

  // Socket Initialization
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    let finalUser = user;
    let finalRoomId = roomId;
    const savedUser = localStorage.getItem("lingo_user");
    const savedRoom = localStorage.getItem("lingo_room");

    if (!finalUser && savedUser) finalUser = JSON.parse(savedUser);
    if (!finalRoomId && savedRoom) finalRoomId = savedRoom;

    if (!finalUser || !finalRoomId) {
      navigate("/");
      return;
    }

    dispatch(setUser(finalUser));
    dispatch(setRoom(finalRoomId));

    const cached = localStorage.getItem(`lingo_code_${finalRoomId}`);
    if (cached) setCode(cached);

    if (!hasLoadedHistory.current && finalUser.clientId) {
      dispatch(
        getTranslationHistory({
          roomId: finalRoomId,
          clientId: finalUser.clientId,
        })
      );
      hasLoadedHistory.current = true;
    }

    joinRoom(
      finalRoomId,
      finalUser.name,
      finalUser.language,
      finalUser.clientId
    );

    const handleUsers = (list: any[]) => {
      const mapped = list.map((u) => ({
        ...u,
        socketId: u.socketId || `client-${u.clientId}`,
      }));
      dispatch(setUsers(mapped));
    };
    socket.on("room-users-list", handleUsers);
    socket.on("room-users-update", handleUsers);

    onInitialCode((initial) => {
      isUpdatingFromSocket.current = true;
      setCode(initial || "");
    });

    onCodeUpdate((data) => {
      isUpdatingFromSocket.current = true;
      setCode(typeof data === "string" ? data : data.code);
    });

    onUserJoined((data) => dispatch(addUser(data)));
    onUserLeft((data) => dispatch(removeUser(data.socketId)));

    return () => {
      removeAllListeners();
      removeTranslationListeners();
      disconnectSocket();
    };
  }, [roomId, user, dispatch, navigate]);

  // Handle cursor updates
  const handleCursorChange = (e: any) => {
    if (isUpdatingFromSocket.current || !roomId || !user) return;
    emitCursorMove(roomId, {
      line: e.position.lineNumber,
      column: e.position.column,
    });
  };

  // Handle code changes
  const handleCodeChange = (value: string | undefined) => {
    if (!value || isUpdatingFromSocket.current) {
      isUpdatingFromSocket.current = false;
      return;
    }

    setCode(value);
    localStorage.setItem(`lingo_code_${roomId}`, value);

    if (roomId && user) emitCodeChange(roomId, value, user.language);
    autoTranslateComments(value);
  };

  const autoTranslateComments = (currentCode: string) => {
    if (translationTimeoutRef.current)
      clearTimeout(translationTimeoutRef.current);

    translationTimeoutRef.current = setTimeout(() => {
      const comments = extractComments(
        currentCode,
        user?.language || "javascript"
      );
      lastCommentsRef.current = comments;

      console.log("📝 Extracted comments:", comments);

      if (comments.length === 0) {
        dispatch(clearTranslations());
        return;
      }

      const commentTexts = comments.map((c) => c.text);
      const commentLines = comments.map((c) => c.line); // ✅ Get lines

      if (roomId) {
        emitTranslateBatch(commentTexts, roomId, commentLines); // ✅ Pass lines
      }
    }, 1000);
  };

  // Translation batch listeners
  useEffect(() => {
    onTranslateStart(() => {
      setIsTranslating(true);
      setTranslationProgress(0);
    });

    onTranslateChunk((data) => {
      console.log("📨 Translate Chunk Data:", data);
      console.log("👤 Current user clientId:", user?.clientId);
      console.log("📍 Current comments ref:", lastCommentsRef.current);

      setTranslationProgress(data.progress);

      // ✅ Now we have the line directly from server!
      if (data.line >= 0) {
        console.log("✅ Dispatching translation with line:", data.line);

        dispatch(
          updateTranslation({
            line: data.line,
            text: data.translatedText,
            originalText: data.originalText,
            senderClientId: data.senderClientId,
            receiverClientId: data.receiverClientId,
          })
        );
      } else {
        console.warn("⚠️ Received translation without line number:", data);
      }
    });

    onTranslateComplete(() => {
      setIsTranslating(false);
      setTranslationProgress(100);
      setTimeout(() => setTranslationProgress(0), 2000);
    });

    onTranslateError(() => {
      setIsTranslating(false);
      setTranslationProgress(0);
    });

    return () => removeTranslationListeners();
  }, [dispatch, user]);

  // Compute active translations
  useEffect(() => {
    console.log("🔄 Translations state updated:", translations);

    const updated = Object.values(translations)
      .filter((t) => t.line !== undefined && t.line >= 0)
      .map((t) => ({
        line: t.line,
        text: t.originalText,
        translation: t.text,
      }));

    console.log("✅ Active translations computed:", updated);
    setActiveTranslations(updated);
  }, [translations]);

  // Debug active translations
  useEffect(() => {
    console.log("🎯 Active translations displayed:", activeTranslations);
  }, [activeTranslations]);

  return (
    <div className="h-screen bg-[#191919] flex flex-col">
      <Header
        roomId={roomId!}
        users={users}
        isTranslating={isTranslating}
        translationProgress={translationProgress}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          users={users}
          user={user ? { ...user, roomId } : null}
          translations={translations}
          isTranslating={isTranslating}
          translationProgress={translationProgress}
          setIsHistoryOpen={() => {}}
        />

        <main className="flex-1 relative bg-[#1e1e1e]">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={handleCodeChange}
            onMount={(editor) => (editorRef.current = editor)}
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

          {/* Floating comment & translation panel */}
          <AnimatePresence>
            {activeTranslations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 20, y: -20 }}
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="absolute top-6 right-6 w-96 bg-[#1e1e1e] backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                  <h3 className="text-white/90 font-medium flex items-center gap-2.5 text-sm tracking-tight">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Languages className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex flex-col">
                      <span>Live Comments</span>
                      <span className="text-[11px] text-gray-500 font-normal">
                        {activeTranslations.length} active
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
                        <div className="flex items-center gap-2 mb-3">
                          <div className="px-2 py-1 rounded-md bg-white/5 border border-white/5">
                            <span className="text-gray-500 font-mono text-[10px] font-medium tracking-wider">
                              LINE {item.line + 1}
                            </span>
                          </div>
                        </div>

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
        </main>
      </div>
    </div>
  );
};

export default EditorPage;
