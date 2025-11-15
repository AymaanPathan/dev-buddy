import { Socket } from "socket.io";
import { UserModel } from "../schema/User.model";
import { RoomModel } from "../schema/Room.model";

export const disconnect = (socket: Socket) => {
  socket.on("disconnect", async () => {
    await RoomModel.updateMany(
      { "users.socketId": socket.id },
      { $set: { "users.$.isActive": false, "users.$.socketId": "" } }
    );

    const user = await UserModel.findOneAndUpdate(
      { socketId: socket.id } as any,
      { lastSeen: new Date() } as any
    );

    const rooms = await RoomModel.find({ "users.socketId": socket.id });
    for (const room of rooms) {
      const users = room.users.map((u) => ({
        name: u.name,
        language: u.language,
        clientId: u.clientId,
        isActive: u.isActive,
      }));
      // emit to room
      socket.to(room.roomId).emit("room-users-update", users);
    }
  });
};
