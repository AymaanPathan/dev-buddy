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
} from "../services/socket";
import { addUser, removeUser, setUsers } from "../store/slice/roomSlice";
import {
  extractComments,
  logComments,
  replaceCommentsWithTranslations,
  type Comment,
} from "../utils/commentDetector";
import { translateBatch } from "../store/slice/translationSlice";
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
  const [detectedComments, setDetectedComments] = useState<Comment[]>([]);
  const [translations, setTranslations] = useState<Map<number, string>>(
    new Map()
  );
  const [showTranslations, setShowTranslations] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("es");

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

      // onCodeUpdate may provide either a string (code) or an object { code, language }
      const data =
        typeof rawData === "string"
          ? { code: rawData, language: "javascript" }
          : rawData;

      let updatedCode = data.code;

      // Extract comments
      const comments = extractComments(updatedCode, "javascript"); // or detect dynamically

      if (comments.length > 0) {
        try {
          const targetLang = getLanguageCode(user?.language || "javascript");

          const results = await dispatch(
            translateBatch({
              texts: comments.map((c) => c.text),
              targetLanguage: targetLang,
              sourceLanguage: "auto",
            })
          ).unwrap();

          const translationMap = new Map<number, string>();
          comments.forEach((c, i) => {
            if (results[i].success)
              translationMap.set(c.line, results[i].translatedText);
          });

          updatedCode = replaceCommentsWithTranslations(
            updatedCode,
            comments,
            translationMap,
            "javascript"
          );
        } catch (err) {
          console.error("Auto translation failed:", err);
        }
      }

      setCode(updatedCode);
    });

    onCursorUpdate((data) => {
      const mySocketId = getSocketId();

      // Ignore your own cursor
      if (data.socketId === mySocketId) {
        return;
      }

      setCursors((prev) => {
        const filtered = prev.filter((c) => c.socketId !== data.socketId);
        return [...filtered, data];
      });

      // Auto-remove typing indicator after 5s
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
      disconnectSocket();
    };
  }, [roomId, user, navigate, dispatch, showTranslations]);

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
  };

  // Handle cursor position changes
  const handleCursorChange = (e: any) => {
    // Don't emit cursor position if we're currently updating from socket
    if (isUpdatingFromSocket.current || !roomId || !user) {
      return;
    }

    const position = e.position;
    emitCursorMove(roomId, {
      line: position.lineNumber,
      column: position.column,
    });
  };

  // Detect comments only
  const handleDetectComments = () => {
    const language = user?.language || "javascript";
    const comments = extractComments(code, language);

    console.log("\n🔍 ===== COMMENT DETECTION =====");
    console.log(`Language: ${language}`);
    console.log(`Total Comments Found: ${comments.length}\n`);

    logComments(comments);
    setDetectedComments(comments);
  };

  // Detect and translate comments
  const handleDetectAndTranslate = async (codeToTranslate?: string) => {
    const currentCode = codeToTranslate || code;
    const language = user?.language || "javascript";
    const comments = extractComments(currentCode, language);

    setDetectedComments(comments);

    if (comments.length === 0) {
      alert("No comments found in the code!");
      return;
    }

    setIsTranslating(true);

    try {
      console.log(
        `🌐 Translating ${comments.length} comments to ${targetLanguage}...`
      );

      // Extract comment texts
      const commentTexts = comments.map((c) => c.text);
      const targetLang = getLanguageCode(user?.language || "javascript");

      // Translate all comments
      const results = await dispatch(
        translateBatch({
          texts: commentTexts,
          targetLanguage: targetLang,
          sourceLanguage: "auto",
        })
      ).unwrap();

      // Create translations map
      const newTranslations = new Map<number, string>();
      comments.forEach((comment, index) => {
        if (results[index].success) {
          newTranslations.set(comment.line, results[index].translatedText);
        }
      });

      setTranslations(newTranslations);
      setShowTranslations(true);

      console.log(
        `✅ Translation complete! ${newTranslations.size} comments translated.`
      );
    } catch (error) {
      console.error("Translation error:", error);
      alert("Translation failed. Check console for details.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Apply translations to code
  const handleApplyTranslations = () => {
    if (translations.size === 0) return;

    const language = user?.language || "javascript";
    const translatedCode = replaceCommentsWithTranslations(
      code,
      detectedComments,
      translations,
      language
    );

    setCode(translatedCode);
    if (roomId) {
      emitCodeChange(roomId, translatedCode);
    }

    setShowTranslations(false);
    setTranslations(new Map());
    setDetectedComments([]);
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

          {/* Detect Comments button */}
          <button
            onClick={handleDetectComments}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Detect
          </button>
          <button
            onClick={() => handleDetectAndTranslate()}
            disabled={isTranslating}
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            <Languages className="w-4 h-4" />
            {isTranslating ? "Translating..." : "Translate"}
          </button>
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

          {/* Detected comments info */}
          {detectedComments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#3e3e42]">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">
                Detected Comments
              </h3>
              <div className="text-xs text-gray-400">
                {detectedComments.length} comment(s) found
              </div>
              {translations.size > 0 && (
                <button
                  onClick={handleApplyTranslations}
                  className="mt-2 w-full px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                >
                  Apply Translations
                </button>
              )}
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

          {/* Translation overlay */}
          {showTranslations && translations.size > 0 && (
            <div className="absolute top-4 left-4 right-4 bg-purple-900/95 backdrop-blur-sm border border-purple-500/50 rounded-lg p-4 max-h-[40vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Translations ({translations.size})
                </h3>
                <button
                  onClick={() => setShowTranslations(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {detectedComments.map((comment, idx) => {
                  const translation = translations.get(comment.line);
                  if (!translation) return null;

                  return (
                    <div
                      key={idx}
                      className="bg-[#1e1e1e]/50 rounded p-2 text-xs border border-purple-500/30"
                    >
                      <div className="text-gray-400 mb-1">
                        Line {comment.line + 1}:
                      </div>
                      <div className="text-gray-300 mb-1">
                        Original: "{comment.text}"
                      </div>
                      <div className="text-purple-300">→ "{translation}"</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cursor indicators */}
          {cursors.length > 0 && (
            <div className="absolute top-4 right-4 space-y-1">
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
    </div>
  );
};

export default EditorPage;
