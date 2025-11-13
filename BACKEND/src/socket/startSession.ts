// backend/socket/startSession.ts
import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

interface StartSessionPayload {
  roomId: string;
}

export const startSession = (socket: Socket) => {
  socket.on("start-session", async (payload: StartSessionPayload) => {
    const { roomId } = payload;

    try {
      // Find room
      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Verify the requester is the creator (first user)
      const creator = room.users[0];
      if (creator?.socketId !== socket.id) {
        socket.emit("error", "Only the room creator can start the session");
        return;
      }

      console.log(`Session started for room ${roomId}`);

      // Broadcast to ALL users in the room including creator
      socket.to(roomId).emit("session-started");
      socket.emit("session-started");
    } catch (error) {
      console.error("Error in startSession:", error);
      socket.emit("error", "Failed to start session");
    }
  });
};
