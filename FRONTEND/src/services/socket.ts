/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket: Socket | null = null;

export const connectSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    socket.on("connect", () => {
      console.log("✅ Connected to server:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
    });

    socket.on("error", (error: string) => {
      console.error("Socket error:", error);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

// === Room events ===
export const joinRoom = (
  roomId: string,
  name: string,
  language: string,
  clientId?: string
) => {
  socket?.emit("join-room", { roomId, name, language, clientId });
};

export const onRoomUsersList = (
  callback: (
    users: {
      name: string;
      language: string;
      clientId: string;
      socketId?: string;
      isActive: boolean;
    }[]
  ) => void
) => {
  socket?.on("room-users-list", callback);
};

// === Code events ===
export const emitCodeChange = (
  roomId: string,
  code: string,
  language: string
) => {
  socket?.emit("code-change", { roomId, code, language });
};

export const onCodeUpdate = (callback: (code: string) => void) => {
  socket?.on("code-update", callback);
};

export const onInitialCode = (callback: (code: string) => void) => {
  socket?.on("initial-code", callback);
};

// === Cursor events ===
export const emitCursorMove = (
  roomId: string,
  cursor: { line: number; column: number }
) => {
  socket?.emit("cursor-move", { roomId, cursor });
};

export const onCursorUpdate = (
  callback: (data: {
    socketId: string;
    cursor: { line: number; column: number };
    name: string;
  }) => void
) => {
  socket?.on("cursor-update", callback);
};

// === User events ===
export const onUserJoined = (
  callback: (data: { name: string; language: string }) => void
) => {
  socket?.on("user-joined", callback);
};

export const onUserLeft = (callback: (data: { name: string }) => void) => {
  socket?.on("user-left", callback);
};

// === Lobby events ===
export const onRoomUsersUpdate = (callback: (data: any) => void) => {
  socket?.on("room-users-update", callback);
};

export const onSessionStarted = (callback: () => void) => {
  socket?.on("session-started", callback);
};

export const emitStartSession = (roomId: string) => {
  socket?.emit("start-session", { roomId });
};

// === Cleanup ===
export const removeAllListeners = () => {
  socket?.removeAllListeners();
};
export const getSocketId = () => socket?.id;

export const emitTranslateBatch = (texts: string[], roomId: string) => {
  const socket = getSocket();
  if (!socket) return;

  // Get clientId from saved user
  const savedUser = localStorage.getItem("lingo_user");
  const clientId = savedUser ? JSON.parse(savedUser).clientId : undefined;

  if (!clientId) {
    console.error("Cannot emit translate:batch — missing clientId");
    return;
  }

  socket.emit("translate:batch", { texts, roomId, clientId });
};
export const onTranslateStart = (
  callback: (data: { total: number }) => void
) => {
  socket?.on("translate:start", callback);
};

export const onTranslateChunk = (
  callback: (data: {
    index: number;
    originalText: string;
    translatedText: string;
    success: boolean;
    progress: number;
    error?: string;
  }) => void
) => {
  socket?.on("translate:chunk", callback);
};

export const onTranslateComplete = (
  callback: (data: { total: number; message: string }) => void
) => {
  socket?.on("translate:complete", callback);
};

export const onTranslateError = (
  callback: (data: { error: string; message?: string }) => void
) => {
  socket?.on("translate:error", callback);
};

export const removeTranslationListeners = () => {
  socket?.off("translate:start");
  socket?.off("translate:chunk");
  socket?.off("translate:complete");
  socket?.off("translate:error");
};
