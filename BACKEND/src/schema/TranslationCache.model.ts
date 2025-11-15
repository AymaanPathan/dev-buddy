import { Schema, model, Document } from "mongoose";

interface ITranslation extends Document {
  hash: string;
  roomId: string; // new
  clientId: string; // new
  originalText: string;
  targetLang: string;
  translatedText: string;
  createdAt: Date;
}

const TranslationSchema = new Schema<ITranslation>(
  {
    hash: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true }, // new
    clientId: { type: String, required: true, index: true }, // new
    originalText: { type: String, required: true },
    targetLang: { type: String, required: true },
    translatedText: { type: String, required: true },
  },
  { timestamps: true }
);

export const TranslationCacheModel = model<ITranslation>(
  "TranslationCache",
  TranslationSchema
);
