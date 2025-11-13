import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

export const disconnect = (socket: Socket) => {
  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    try {
      // Find room with this user
      const room = await RoomModel.findOne({ "users.socketId": socket.id });

      if (!room) {
        return;
      }

      // Find and remove the user
      const userIndex = room.users.findIndex((u) => u.socketId === socket.id);

      if (userIndex !== -1) {
        const [removedUser] = room.users.splice(userIndex, 1);

        // Get creator after removal
        const creatorSocketId = room.users[0]?.socketId || "";

        // Notify others in the room with updated user list
        socket.to(room.roomId).emit("room-users-update", {
          users: room.users.map((u) => ({
            name: u.name,
            language: u.language,
            socketId: u.socketId,
          })),
          creatorSocketId,
        });

        console.log(`${removedUser.name} left room ${room.roomId}`);

        // Save updated room or delete if empty
        if (room.users.length === 0) {
          await RoomModel.deleteOne({ roomId: room.roomId });
          console.log(`Room ${room.roomId} deleted (empty)`);
        } else {
          await room.save();
        }
      }
    } catch (error) {
      console.error("Error in disconnect:", error);
    }
  });
};
