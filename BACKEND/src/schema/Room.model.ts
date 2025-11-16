import { Schema, model, Document } from "mongoose";

interface RoomUser {
  clientId: string;
  name: string;
  language: string;
  socketId?: string;
  isActive?: boolean;
}

interface IRoom extends Document {
  roomId: string;
  createdBy?: string;
  currentCode: string;
  language?: string;
  users: RoomUser[];
  updatedAt: Date;
}

const RoomUserSchema = new Schema<RoomUser>({
  clientId: { type: String, required: true },
  name: { type: String, required: true },
  language: { type: String, required: true },
  socketId: { type: String, default: "" },
  isActive: { type: Boolean, default: false },
});

const RoomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, index: true },
    createdBy: { type: String },
    currentCode: { type: String, default: "" },
    language: { type: String, default: "javascript" },
    users: { type: [RoomUserSchema], default: [] },
  },
  { timestamps: true }
);

export const RoomModel = model<IRoom>("Room", RoomSchema);
