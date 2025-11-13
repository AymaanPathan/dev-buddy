import { Socket } from "socket.io";
import { rooms } from "..";

interface CodeChangePayload {
  roomId: string;
  code: string;
}

export const codeChange = (socket: Socket) => {
  socket.on("code-change", (payload: CodeChangePayload) => {
    const { roomId, code } = payload;
    if (!rooms[roomId]) return;

    rooms[roomId].code = code;

    socket.to(roomId).emit("code-update", code);
  });
};
