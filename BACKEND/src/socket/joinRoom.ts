import { Socket } from "socket.io";
import { RoomModel } from "../schema/Room.model";

interface JoinRoomPayload {
  roomId: string;
  name: string;
  language: string;
}

export const joinRoom = (socket: Socket) => {
  socket.on("join-room", async (payload: JoinRoomPayload) => {
    console.log("🔵 join-room event received:", payload);
    const { roomId, name, language } = payload;

    try {
      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        console.error("❌ Room not found:", roomId);
        socket.emit("error", "Room not found");
        return;
      }

      socket.join(roomId);
      socket.data.name = name;
      socket.data.language = language;
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`);

      const existingUser = room.users.find((u) => u.name === name);

      let updatedRoom;

      if (existingUser) {
        console.log(`♻️ User ${name} rejoined, updating socketId`);

        updatedRoom = await RoomModel.findOneAndUpdate(
          { roomId, "users.name": name },
          {
            $set: {
              "users.$.socketId": socket.id,
              "users.$.language": language,
            },
          },
          { new: true }
        );
      } else {
        console.log(`➕ Adding new user ${name} to room ${roomId}`);

        updatedRoom = await RoomModel.findOneAndUpdate(
          { roomId },
          {
            $addToSet: {
              users: {
                socketId: socket.id,
                name,
                language,
              },
            },
          },
          { new: true }
        );

        socket.to(roomId).emit("user-joined", { name, language });
      }

      if (!updatedRoom) {
        console.error("❌ Failed to update room");
        socket.emit("error", "Failed to update room");
        return;
      }

      socket.emit(
        "initial-code",
        updatedRoom.code || "// Start coding together...\n"
      );
      console.log(`📝 Sent initial code to ${name}`);

      const otherUsers = updatedRoom.users
        .filter((u) => u.socketId !== socket.id)
        .map((u) => ({ name: u.name, language: u.language }));

      socket.emit("room-users-list", otherUsers);

      const creatorSocketId = updatedRoom.users[0]?.socketId || "";

      const allUsers = updatedRoom.users.map((u) => ({
        name: u.name,
        language: u.language,
        socketId: u.socketId,
      }));

      socket.to(roomId).emit("room-users-update", {
        users: allUsers,
        creatorSocketId,
      });

      socket.emit("room-users-update", {
        users: allUsers,
        creatorSocketId,
      });

      console.log(`✅ ${name} successfully joined room ${roomId}`);
    } catch (error) {
      console.error("❌ Error in joinRoom:", error);
      socket.emit("error", "Failed to join room");
    }
  });
};
