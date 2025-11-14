/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/EditorPage.tsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Editor from "@monaco-editor/react";
import { Users, Copy, Check } from "lucide-react";
import type { RootState } from "../store";
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
  removeAllListeners,
} from "../services/socket";

interface User {
  name: string;
  language: string;
}

interface Cursor {
  socketId: string;
  name: string;
  cursor: { line: number; column: number };
}

const EditorPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.room);

  const [code, setCode] = useState("// Start coding together...\n");
  const [users, setUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<Cursor[]>([]);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<any>(null);
  const isUpdatingFromSocket = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (!roomId || !user) {
      navigate("/");
      return;
    }

    connectSocket();

    // Join room
    joinRoom(roomId, user.name, user.language);

    // Handle initial code
    onInitialCode((initialCode) => {
      isUpdatingFromSocket.current = true;
      setCode(initialCode || "// Start coding together...\n");
    });

    // Handle code updates from other users
    onCodeUpdate((updatedCode) => {
      isUpdatingFromSocket.current = true;
      setCode(updatedCode);
    });

    // Handle cursor updates
    onCursorUpdate((data) => {
      setCursors((prev) => {
        const filtered = prev.filter((c) => c.socketId !== data.socketId);
        return [...filtered, data];
      });
    });

    // Handle user joined
    onUserJoined((data) => {
      setUsers((prev) => [...prev, data]);
      console.log(`${data.name} joined (${data.language})`);
    });

    // Handle user left
    onUserLeft((data) => {
      setUsers((prev) => prev.filter((u) => u.name !== data.name));
      setCursors((prev) => prev.filter((c) => c.name !== data.name));
      console.log(`${data.name} left`);
    });

    return () => {
      removeAllListeners();
      disconnectSocket();
    };
  }, [roomId, user, navigate]);

  // Handle code changes
  const handleCodeChange = (value: string | undefined) => {
    if (!value || isUpdatingFromSocket.current) {
      isUpdatingFromSocket.current = false;
      return;
    }

    setCode(value);
    if (roomId) {
      emitCodeChange(roomId, value);
    }
  };

  // Handle cursor position changes
  const handleCursorChange = (e: any) => {
    if (!roomId || !user) return;

    const position = e.position;
    emitCursorMove(
      roomId,
      { line: position.lineNumber, column: position.column },
      user.name
    );
  };

  // Copy room link
  const copyRoomLink = () => {
    const link = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

          {/* Copy link button */}
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
        </div>
      </header>

      {/* Sidebar - Users list */}
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-[#252526] border-r border-[#3e3e42] p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">
            Active Users
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
            {users.map((u, idx) => (
              <div
                key={idx}
                className="p-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg"
              >
                <div className="font-medium text-sm text-white">{u.name}</div>
                <div className="text-xs text-gray-400">{u.language}</div>
              </div>
            ))}
          </div>
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

          {/* Cursor indicators (basic visual feedback) */}
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
