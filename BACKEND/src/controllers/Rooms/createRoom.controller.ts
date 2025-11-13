import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { RoomModel } from "../../schema/Room.model";

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, language } = req.body;

    if (!name || !language) {
      return res.status(400).json({ error: "Name and language are required" });
    }

    // Generate unique room ID
    const roomId = uuidv4().slice(0, 6);

    // Create room document
    const newRoom = await RoomModel.create({
      roomId,
      users: [{ name, language, socketId: "" }],
      code: "",
    });

    const roomLink = `http://localhost:5174/room/${roomId}`;

    res.status(201).json({
      success: true,
      roomId,
      roomLink,
      room: newRoom,
    });
  } catch (error: any) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
};
