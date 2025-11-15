/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/EditorPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Editor from "@monaco-editor/react";

import { Users, MessageSquare, Languages, X } from "lucide-react";
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
    <div className="h-screen bg-[#1e1e1e] flex flex-col">
      {/* Header */}
      <header className="h-14 bg-[#252526] border-b border-[#3e3e42] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-semibold">CodeBridge</h1>
          <div className="text-sm text-gray-400">
            Room: <span className="font-mono">{roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active users */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-300">{users.length + 1}</span>
          </div>

          {/* Auto-translate indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <Languages className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Auto-translate: ON</span>
          </div>

          {/* Translation status */}
          {isTranslating && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded-lg border border-[#3e3e42]">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-300">
                Translating... {translationProgress}%
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar - Users list */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-[#252526] border-r border-[#3e3e42] p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Active Users ({users.length + 1})
          </h3>
          <div className="space-y-2">
            {/* Current user */}
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="font-medium text-sm text-white">
                {user?.name} (You)
              </div>
              <div className="text-xs text-gray-400">{user?.language}</div>
            </div>

            {/* Other users */}
            {users.map((u, idx) => {
              return (
                <div
                  key={`${u.name}-${idx}`}
                  className="p-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg"
                >
                  <div className="font-medium text-sm text-white">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.language}</div>
                </div>
              );
            })}

            {users.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No other users yet
              </div>
            )}
          </div>

          {/* Translation info */}
          {translations.size > 0 && (
            <div className="mt-4 pt-4 border-t border-[#3e3e42]">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                <Languages className="w-4 h-4 inline mr-1" />
                Live Translations
              </h3>
              <div className="text-xs text-gray-400">
                {translations.size} comment(s) translated
              </div>
              <div className="text-xs text-purple-400 mt-1">
                Translations update automatically
              </div>
            </div>
          )}

          {/* Progress bar */}
          {isTranslating && translationProgress > 0 && (
            <div className="mt-4 pt-4 border-t border-[#3e3e42]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">
                  Translation Progress
                </span>
                <span className="text-xs text-purple-400 font-mono">
                  {translationProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${translationProgress}%` }}
                />
              </div>
            </div>
          )}
        </aside>

        {/* Editor */}
        <main className="flex-1 relative">
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
            }}
          />

          {/* Floating translation panel */}
          {translations.size > 0 && (
            <div className="absolute top-4 right-4 w-80 bg-purple-900/95 backdrop-blur-sm border border-purple-500/50 rounded-lg p-3 max-h-[60vh] overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                  <Languages className="w-4 h-4" />
                  Live Translations ({translations.size})
                </h3>
                <button
                  onClick={() => setTranslations(new Map())}
                  className="text-gray-300 hover:text-white transition-colors"
                  title="Clear translations"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {lastCommentsRef.current.map((comment, idx) => {
                  const translation = translations.get(comment.line);
                  if (!translation) return null;

                  return (
                    <div
                      key={idx}
                      className="bg-[#1e1e1e]/50 rounded p-2 text-xs border border-purple-500/30 animate-fade-in"
                    >
                      <div className="text-gray-400 mb-1 font-mono">
                        Line {comment.line + 1}
                      </div>
                      <div className="text-gray-300 mb-1">
                        <span className="text-gray-500">Original:</span> "
                        {comment.text}"
                      </div>
                      <div className="text-purple-300">
                        <span className="text-purple-500">→</span> "
                        {translation}"
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cursor indicators */}
          {cursors.length > 0 && (
            <div className="absolute top-4 left-4 space-y-1">
              {cursors.map((c) => (
                <div
                  key={c.socketId}
                  className="px-2 py-1 bg-violet-500/20 border border-violet-500/50 rounded text-xs text-violet-300"
                >
                  {c.name} is typing...
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Add custom CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EditorPage;
