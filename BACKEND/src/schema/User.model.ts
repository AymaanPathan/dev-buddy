import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  clientId: string;
  name: string;
  language: string;
  currentRoomId?: string | null;
  lastSeen?: Date;
}

const UserSchema = new Schema<IUser>({
  clientId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  language: { type: String, required: true },
  currentRoomId: { type: String, default: null },
  lastSeen: { type: Date, default: Date.now },
});

export const UserModel = model<IUser>("User", UserSchema);
