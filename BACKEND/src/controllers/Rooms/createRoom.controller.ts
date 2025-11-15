import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { RoomModel } from "../../schema/Room.model";
import { UserModel } from "../../schema/User.model";

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, language } = req.body;

    if (!name || !language) {
      return res.status(400).json({ error: "Name and language are required" });
    }

    // Generate unique room ID
    const roomId = uuidv4().slice(0, 6);

    // Create room document
    const room = await RoomModel.create({
      roomId,
      createdBy: name,
      language,
      currentCode: "// Start coding together...\n",
      users: [
        { userId: uuidv4(), name, language, socketId: "", isActive: false },
      ],
    });

    await UserModel.updateOne({ name }, { name, language }, { upsert: true });

    const roomLink = `http://localhost:5173/room/${roomId}`;

    res.status(201).json({
      success: true,
      roomId,
      roomLink,
      room,
    });
  } catch (error: any) {
    console.error("Error creating room:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
};
