import { RoomModel } from "../../schema/Room.model";
import { Request, Response } from "express";
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
    const userExists = room.users.some((user) => user.name === name);

    if (!userExists) {
      // Add user to room
      room.users.push({
        name,
        language,
        socketId: "",
      });
      await room.save();
    }

    return res.status(200).json({
      success: true,
      room,
      message: `Joined room ${roomId}`,
    });
  } catch (error: any) {
    console.error("Error joining room:", error);
    return res.status(500).json({ error: "Failed to join room" });
  }
};


