import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

export const codeChange = (socket: Socket) => {
  socket.on(
    "code-change",
    async ({
      roomId,
      code,
      language,
    }: {
      roomId: string;
      code: string;
      language?: string;
    }) => {
      if (!roomId) return;
      // broadcast to others
      socket.to(roomId).emit("code-update", { code, language });
      // persist to DB
      await RoomModel.findOneAndUpdate(
        { roomId },
        { currentCode: code, updatedAt: new Date() },
        { upsert: true }
      );
    }
  );
};
