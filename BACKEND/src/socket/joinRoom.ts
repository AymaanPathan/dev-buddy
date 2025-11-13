// backend/socket/joinRoom.ts
import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

interface JoinRoomPayload {
  roomId: string;
  name: string;
  language: string;
}

export const joinRoom = (socket: Socket) => {
  socket.on("join-room", async (payload: JoinRoomPayload) => {
    const { roomId, name, language } = payload;

    try {
      // Find room in MongoDB
      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      // Join socket.io room
      socket.join(roomId);

      // Check if user already exists
      const existingUser = room.users.find((u) => u.name === name);

      if (existingUser) {
        // Update socketId if user rejoins
        existingUser.socketId = socket.id;
      } else {
        // Add new user
        room.users.push({
          socketId: socket.id,
          name,
          language,
        });
      }

      await room.save();

      // Get creator (first user)
      const creatorSocketId = room.users[0]?.socketId || "";

      // Broadcast updated user list to ALL users in room (including sender)
      socket.to(roomId).emit("room-users-update", {
        users: room.users.map((u) => ({
          name: u.name,
          language: u.language,
          socketId: u.socketId,
        })),
        creatorSocketId,
      });

      // Also send to the user who just joined
      socket.emit("room-users-update", {
        users: room.users.map((u) => ({
          name: u.name,
          language: u.language,
          socketId: u.socketId,
        })),
        creatorSocketId,
      });

      console.log(`${name} joined room ${roomId}`);
    } catch (error) {
      console.error("Error in joinRoom:", error);
      socket.emit("error", "Failed to join room");
    }
  });
};
