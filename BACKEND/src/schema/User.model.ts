import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  userId: string;
  name: string;
  language: string;
  currentRoomId?: string | null;
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, index: true, unique: true },
  name: { type: String, required: true },
  language: { type: String, required: true },
  currentRoomId: { type: String, default: null },
});

export const UserModel = model<IUser>("User", UserSchema);
