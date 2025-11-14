import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

export const disconnect = (socket: Socket) => {
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      // Find room with this user
      const room = await RoomModel.findOne({ "users.socketId": socket.id });

      if (!room) return;

      // Remove the user from the room
      const updatedUsers = room.users.filter((u) => u.socketId !== socket.id);

      // Update room users in DB (atomic update)
      await RoomModel.updateOne(
        { roomId: room.roomId },
        { users: updatedUsers }
      );

      // Get creator after removal
      const creatorSocketId = updatedUsers[0]?.socketId || "";

      // Notify remaining users
      socket.to(room.roomId).emit("room-users-update", {
        users: updatedUsers.map((u) => ({
          name: u.name,
          language: u.language,
          socketId: u.socketId,
        })),
        creatorSocketId,
      });

      console.log(`User ${socket.id} left room ${room.roomId}`);
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
};
