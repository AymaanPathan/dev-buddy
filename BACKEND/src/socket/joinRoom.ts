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
    console.log("🔵 join-room event received:", payload);
    const { roomId, name, language } = payload;

    try {
      // Find room in MongoDB
      const room = await RoomModel.findOne({ roomId });

      if (!room) {
        console.error("❌ Room not found:", roomId);
        socket.emit("error", "Room not found");
        return;
      }

      // Join socket.io room
      socket.join(roomId);
      console.log(`✅ Socket ${socket.id} joined room ${roomId}`);

      // Check if user already exists (by name)
      const existingUserIndex = room.users.findIndex((u) => u.name === name);

      if (existingUserIndex !== -1) {
        // Update socketId if user rejoins (e.g., navigating from lobby to editor)
        console.log(`♻️ User ${name} rejoined, updating socket ID`);
        room.users[existingUserIndex].socketId = socket.id;
      } else {
        // Add new user
        console.log(`✅ Adding new user ${name} to room ${roomId}`);
        room.users.push({
          socketId: socket.id,
          name,
          language,
        });

        // Notify OTHER users that someone new joined (only for truly new users, not rejoins)
        socket.to(roomId).emit("user-joined", { name, language });
      }

      await room.save();

      // Send initial code to the joining user
      socket.emit("initial-code", room.code || "// Start coding together...\n");
      console.log(`📝 Sent initial code to ${name}`);

      // Get all users EXCEPT the current one for the users list
      const otherUsers = room.users
        .filter((u) => u.socketId !== socket.id)
        .map((u) => ({ name: u.name, language: u.language }));

      console.log(`📤 Sending ${otherUsers.length} other users to ${name}`);

      // Send the list of other users to the newly joined user
      socket.emit("room-users-list", otherUsers);

      // Get creator (first user)
      const creatorSocketId = room.users[0]?.socketId || "";

      // Update lobby view for all users (for those still in lobby)
      const allUsers = room.users.map((u) => ({
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
