import { RoomModel } from "../../schema/Room.model";
import { UserModel } from "../../schema/User.model";
import { Request, Response } from "express";

export const leaveRoomController = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { name } = req.body;
  const room = await RoomModel.findOne({ roomId });
  if (!room) return res.status(404).json({ error: "room not found" });

  room.users = room.users.filter((u) => u.name !== name);
  await room.save();

  await UserModel.updateOne({ name }, { $set: { currentRoomId: null } });

  return res.json({ success: true, message: "left" });
};
