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
export const joinRoom = (roomId: string, name: string, language: string) => {
  socket?.emit("join-room", { roomId, name, language });
};
export const onRoomUsersList = (
  callback: (users: { name: string; language: string }[]) => void
) => {
  socket?.on("room-users-list", callback);
};

// === Code events ===
export const emitCodeChange = (roomId: string, code: string) => {
  socket?.emit("code-change", { roomId, code });
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
