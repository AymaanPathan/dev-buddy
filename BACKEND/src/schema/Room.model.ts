import mongoose, { Schema, Document } from "mongoose";

export interface IRoomUser {
  name: string;
  language: string;
  socketId: string;
}

export interface IRoom extends Document {
  roomId: string;
  users: IRoomUser[];
  code: string;
  createdAt: Date;
}

const roomUserSchema = new Schema<IRoomUser>({
  name: { type: String, required: true },
  language: { type: String, required: true },
  socketId: { type: String, default: "" },
});

const roomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, unique: true },
    users: [roomUserSchema],
    code: { type: String, default: "" },
  },
  { timestamps: true }
);

export const RoomModel = mongoose.model<IRoom>("Room", roomSchema);
