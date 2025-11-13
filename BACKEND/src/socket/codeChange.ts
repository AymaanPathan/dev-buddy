import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

interface CodeChangePayload {
  roomId: string;
  code: string;
}

export const codeChange = (socket: Socket) => {
  socket.on("code-change", async (payload: CodeChangePayload) => {
    const { roomId, code } = payload;

    try {
      // Update code in MongoDB
      const room = await RoomModel.findOneAndUpdate(
        { roomId },
        { code },
        { new: true } // Return updated document
      );

      if (!room) {
        console.error(`Room ${roomId} not found`);
        return;
      }

      // Broadcast to all other users in the room
      socket.to(roomId).emit("code-update", code);
    } catch (error) {
      console.error("Error in codeChange:", error);
    }
  });
};
