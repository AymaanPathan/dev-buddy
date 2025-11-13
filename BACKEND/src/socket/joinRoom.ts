import { Socket } from "socket.io";
import { rooms } from "..";
import { User } from "../utils/interface/room.interface";

interface JoinRoomPayload {
  roomId: string;
  name: string;
  language: string;
}

export const joinRoom = (socket: Socket) => {
  socket.on("join-room", (payload: JoinRoomPayload) => {
    const { roomId, name, language } = payload;

    if (!rooms[roomId]) {
      socket.emit("error", "Room not found");
      return;
    }

    // Join socket.io room
    socket.join(roomId);

    // Add user
    const user: User = { name, language, socketId: socket.id };
    rooms[roomId].users.push(user);

    // Send existing code
    socket.emit("initial-code", rooms[roomId].code);

    // Notify others
    socket.to(roomId).emit("user-joined", { name, language });

    console.log(`${name} joined room ${roomId}`);
  });
};
