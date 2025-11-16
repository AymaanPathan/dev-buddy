import { RoomModel } from "../../schema/Room.model";

import { Request, Response } from "express";
import { UserModel } from "../../schema/User.model";

export const joinRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { name, language, clientId } = req.body;
  if (!name || !language || !clientId)
    return res.status(400).json({ error: "name, language, clientId required" });

  const room = await RoomModel.findOne({ roomId });
  if (!room) return res.status(404).json({ error: "room not found" });

  const exists = room.users.some((u) => u.clientId === clientId);
  if (!exists) {
    room.users.push({
      clientId,
      name,
      language,
      socketId: "",
      isActive: false,
    });
    await room.save();
  }

  await UserModel.updateOne(
    { clientId },
    { clientId, name, language, currentRoomId: roomId },
    { upsert: true }
  );

  return res.json({ success: true, room });
};
