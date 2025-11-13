import { Socket } from "socket.io";
import { rooms } from "..";

export const disconnect = (socket: Socket) => {
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    Object.keys(rooms).forEach((roomId) => {
      const room = rooms[roomId];
      const index = room.users.findIndex((u) => u.socketId === socket.id);
      if (index !== -1) {
        const [removedUser] = room.users.splice(index, 1);

        socket.to(roomId).emit("user-left", { name: removedUser.name });
        console.log(`${removedUser.name} left room ${roomId}`);
      }

      if (room.users.length === 0) {
        delete rooms[roomId];
        console.log(`Room ${roomId} deleted (empty)`);
      }
    });
  });
};
