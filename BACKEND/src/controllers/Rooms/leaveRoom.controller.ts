import { RoomModel } from "../../schema/Room.model";
import { UserModel } from "../../schema/User.model";
import { Request, Response } from "express";

export const leaveRoomController = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { clientId } = req.body;
  if (!clientId) return res.status(400).json({ error: "clientId required" });

  const room = await RoomModel.findOne({ roomId });
  if (!room) return res.status(404).json({ error: "room not found" });

  room.users = room.users.filter((u) => u.clientId !== clientId);
  await room.save();

  await UserModel.updateOne({ clientId }, { $set: { currentRoomId: null } });

  return res.json({ success: true, message: "left" });
};
