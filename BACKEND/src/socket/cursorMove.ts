import { Socket } from "socket.io";

interface CursorMovePayload {
  roomId: string;
  cursor: { line: number; column: number };
}

export const cursorMove = (socket: Socket) => {
  socket.on("cursor-move", (payload: CursorMovePayload) => {
    const { roomId, cursor } = payload;
    socket.to(roomId).emit("cursor-update", { socketId: socket.id, cursor });
  });
};
