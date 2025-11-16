import { Socket } from "socket.io";

interface CursorMovePayload {
  roomId: string;
  cursor: { line: number; column: number };
}

export const cursorMove = (socket: Socket) => {
  socket.on("cursor-move", (payload: CursorMovePayload) => {
    const { roomId, cursor } = payload;

    console.log(
      `🖱️ Cursor move from socket ${socket.id}, name: ${socket.data.name}`
    );

    socket.to(roomId).emit("cursor-update", {
    socketId: socket.id,
      cursor,
      name: socket.data.name,
    });

    console.log(
      `📤 Broadcasted cursor update: ${socket.data.name} at line ${cursor.line}, col ${cursor.column}`
    );
  });
};
