import { Schema, model, Document } from "mongoose";

interface ITranslation extends Document {
  hash: string; 
  originalText: string;
  targetLang: string;
  translatedText: string;
  createdAt: Date;
}

const TranslationSchema = new Schema<ITranslation>(
  {
    hash: { type: String, required: true, index: true, unique: true },
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
