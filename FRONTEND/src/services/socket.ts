// src/services/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
        autoConnect: true,
      });

      this.socket.on("connect", () => {
        console.log("✅ Connected to server:", this.socket?.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Disconnected from server");
      });

      this.socket.on("error", (error: string) => {
        console.error("Socket error:", error);
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Room events
  joinRoom(roomId: string, name: string, language: string) {
    this.socket?.emit("join-room", { roomId, name, language });
  }

  // Code events
  emitCodeChange(roomId: string, code: string) {
    this.socket?.emit("code-change", { roomId, code });
  }

  onCodeUpdate(callback: (code: string) => void) {
    this.socket?.on("code-update", callback);
  }

  onInitialCode(callback: (code: string) => void) {
    this.socket?.on("initial-code", callback);
  }

  // Cursor events
  emitCursorMove(
    roomId: string,
    cursor: { line: number; column: number },
    name: string
  ) {
    this.socket?.emit("cursor-move", { roomId, cursor, name });
  }

  onCursorUpdate(
    callback: (data: {
      socketId: string;
      cursor: { line: number; column: number };
      name: string;
    }) => void
  ) {
    this.socket?.on("cursor-update", callback);
  }

  // User events
  onUserJoined(callback: (data: { name: string; language: string }) => void) {
    this.socket?.on("user-joined", callback);
  }

  onUserLeft(callback: (data: { name: string }) => void) {
    this.socket?.on("user-left", callback);
  }

  // Lobby events
  onRoomUsersUpdate(callback: (data: any) => void) {
    this.socket?.on("room-users-update", callback);
  }

  onSessionStarted(callback: () => void) {
    this.socket?.on("session-started", callback);
  }

  emitStartSession(roomId: string) {
    this.socket?.emit("start-session", { roomId });
  }

  // Cleanup
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new SocketService();
