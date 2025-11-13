import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { Room } from "../../utils/types/Room.type";

const rooms: Record<string, Room> = {};

export const createRoom = (req: Request, res: Response) => {
  const { name, language } = req.body;

  if (!name || !language) {
    return res.status(400).json({ error: "Name and language are required" });
  }

  // Generate unique room ID
  const roomId = uuidv4().slice(0, 6);

  // Store room in memory
  rooms[roomId] = {
    users: [
      {
        name,
        language,
        socketId: "",
      },
    ],
    code: "",
  };

  // Return room link
  const roomLink = `http://localhost:5174/room/${roomId}`;
  res.json({ roomId, roomLink });
};
