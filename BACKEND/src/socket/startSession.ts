import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

interface StartSessionPayload {
  roomId: string;
}

export const startSession = (socket: Socket) => {
  socket.on("start-session", async (payload: StartSessionPayload) => {
    const { roomId } = payload;

    try {
      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      const creator = room.users[0];
      if (creator?.socketId !== socket.id) {
        socket.emit("error", "Only the room creator can start the session");
        return;
      }

      console.log(`Session started for room ${roomId}`);

      socket.to(roomId).emit("session-started");
      socket.emit("session-started");
    } catch (error) {
      console.error("Error in startSession:", error);
      socket.emit("error", "Failed to start session");
    }
  });
};
