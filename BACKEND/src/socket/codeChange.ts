import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

export const codeChange = (io: any, socket: Socket) => {
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
      io.to(roomId).emit("code-update", code);

      await RoomModel.findOneAndUpdate(
        { roomId },
        { currentCode: code, updatedAt: new Date() },
        { upsert: true }
      );
    }
  );
};
