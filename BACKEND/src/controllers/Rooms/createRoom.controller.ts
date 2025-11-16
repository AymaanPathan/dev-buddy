import { v4 as uuidv4 } from "uuid";
import { Request, Response } from "express";
import { RoomModel } from "../../schema/Room.model";
import { UserModel } from "../../schema/User.model";

export const createRoom = async (req: Request, res: Response) => {
  const { name, language, clientId, programmingLanguage } = req.body;
  if (!name || !language || !clientId)
    return res.status(400).json({ error: "name, language, clientId required" });

  const roomId = uuidv4().slice(0, 6);

  const room = await RoomModel.create({
    roomId,
    createdBy: name,
    language,
    currentCode: "",
    programmingLanguage,
    users: [{ clientId, name, language, socketId: "", isActive: false }],
  });

  await UserModel.updateOne(
    { clientId },
    { clientId, name, language, programmingLanguage, currentRoomId: roomId },
    { upsert: true }
  );

  res.status(201).json({ success: true, roomId, room });
};
