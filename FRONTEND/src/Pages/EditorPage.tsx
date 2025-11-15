/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/EditorPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

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
import { extractComments, type Comment } from "../utils/commentDetector";
import { getLanguageCode } from "../utils/getLanCode.utils";
import { Header } from "../components/EditorPageComponents/Header";
import { Sidebar } from "../components/EditorPageComponents/Sidebar";
import { CodeEditor } from "../components/EditorPageComponents/CodeEditor";

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
  const translationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [lastComments, setLastComments] = useState<Comment[]>([]);

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

      if (data.success && lastComments[data.index]) {
        setTranslations((prev) => {
          const newMap = new Map(prev);
          newMap.set(lastComments[data.index].line, data.translatedText);
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
        setLastComments([]);
        return;
      }

      console.log(`🔍 Auto-detecting ${comments.length} comments...`);
      setLastComments(comments);
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
        <CodeEditor
          code={code}
          handleCodeChange={handleCodeChange}
          handleCursorChange={handleCursorChange}
          editorRef={editorRef}
          translations={translations}
          setTranslations={setTranslations}
          lastComments={lastComments}
          cursors={cursors}
        />
      </div>
    </div>
  );
};

export default EditorPage;
