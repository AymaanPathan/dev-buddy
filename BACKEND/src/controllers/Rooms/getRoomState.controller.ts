import { RoomModel } from "../../schema/Room.model";
import { Request, Response } from "express";

export const getRoomStateController = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = await RoomModel.findOne({ roomId });
  if (!room) return res.status(404).json({ error: "room not found" });
  return res.json({ success: true, room });
};
