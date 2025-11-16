import { Socket, Server } from "socket.io";
import { RoomModel } from "../schema/Room.model";
import { UserModel } from "../schema/User.model";
import { getLanguageCode } from "../utils/getLanCode.utils";

export const joinRoom = (io: Server, socket: Socket) => {
  socket.on(
    "join-room",
    async (payload: {
      roomId: string;
      name: string;
      language: string;
      clientId: string;
    }) => {
      const { roomId, name, language, clientId } = payload;

      console.log(`User ${name} is attempting to join room ${roomId}`);

      if (!roomId || !name || !language || !clientId) {
        socket.emit("error", "join-room: missing fields");
        return;
      }

      const room = await RoomModel.findOne({ roomId });
      if (!room) {
        socket.emit("error", "room not found");
        return;
      }

      const userIndex = room.users.findIndex((u) => u.clientId === clientId);

      if (userIndex === -1) {
        room.users.push({
          clientId,
          name,
          language,
          socketId: socket.id,
          isActive: true,
        });
      } else {
        room.users[userIndex].socketId = socket.id;
        room.users[userIndex].isActive = true;
        room.users[userIndex].name = name;
        room.users[userIndex].language = language;
      }

      await room.save();

      await UserModel.findOneAndUpdate(
        { clientId },
        {
          clientId,
          name,
          language,
          currentRoomId: roomId,
          lastSeen: new Date(),
        },
        { upsert: true }
      );

      socket.join(roomId);
      socket.data.language = getLanguageCode(language);

      socket.emit("initial-code", room.currentCode);
      socket.emit("room-state", { code: room.currentCode, users: room.users });
      socket.to(roomId).emit("user-joined", { name, language, clientId });
      io.in(roomId).emit(
        "room-users-update",
        room.users.map((u) => ({
          name: u.name,
          language: u.language,
          clientId: u.clientId,
          isActive: u.isActive,
        }))
      );

      socket.emit(
        "room-users-list",
        room.users.map((u) => ({
          name: u.name,
          language: u.language,
          clientId: u.clientId,
          socketId: u.socketId,
          isActive: u.isActive,
        }))
      );
    }
  );
};
