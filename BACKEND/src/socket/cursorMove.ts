import { Socket } from "socket.io";

interface CursorMovePayload {
  roomId: string;
  cursor: { line: number; column: number };
  name: string; // Add name for cursor identification
}

export const cursorMove = (socket: Socket) => {
  socket.on("cursor-move", (payload: CursorMovePayload) => {
    const { roomId, cursor, name } = payload;

    // Broadcast cursor position to others
    socket.to(roomId).emit("cursor-update", {
      socketId: socket.id,
      cursor,
      name,
    });
  });
};
