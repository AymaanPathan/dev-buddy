import { RoomModel } from "../../schema/Room.model";
import { v4 as uuidv4 } from "uuid";

import { Request, Response } from "express";
import { UserModel } from "../../schema/User.model";
export const joinRoom = async (req: Request, res: Response) => {
  console.log("🔥 joinRoom called");

  try {
    const { roomId } = req.params;
    const { name, language } = req.body;

    if (!name || !language) {
      return res.status(400).json({ error: "Name and language are required" });
    }

    // Find the room
    const room = await RoomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    // Check if user already exists in room (prevent duplicates)
    const exists = room.users.some((u) => u.name === name);
    if (!exists) {
      const userId = uuidv4();
      room.users.push({
        userId,
        name,
        language,
        socketId: "",
        isActive: false,
      });
      await room.save();
      await UserModel.updateOne(
        { userId },
        { userId, name, language, currentRoomId: roomId },
        { upsert: true }
      );
    }
    return res.json({ success: true, room });
  } catch (error: any) {
    console.error("Error joining room:", error);
    return res.status(500).json({ error: "Failed to join room" });
  }
};
