import mongoose, { Schema, Document } from "mongoose";

interface RoomUser {
  userId: string;
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
  userId: { type: String, required: true },
  name: { type: String, required: true },
  language: { type: String, required: true },
  socketId: { type: String, default: "" },
  isActive: { type: Boolean, default: false },
});

const RoomSchema = new Schema<IRoom>(
  {
    roomId: { type: String, required: true, index: true, unique: true },
    createdBy: { type: String },
    currentCode: { type: String, default: "// Start coding together...\n" },
    language: { type: String, default: "javascript" },
    users: { type: [RoomUserSchema], default: [] },
  },
  { timestamps: true }
);

export const RoomModel = mongoose.model<IRoom>("Room", RoomSchema);
