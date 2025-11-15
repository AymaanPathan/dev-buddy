// controllers/translation.controller.ts
import { Request, Response } from "express";
import { TranslationCacheModel } from "../../schema/TranslationCache.model";

export const getTranslationHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const { roomId } = req.params;

    if (!roomId) {
      return res.status(400).json({ success: false, error: "Missing roomId" });
    }

    const history = await TranslationCacheModel.find({ roomId })
      .sort({ line: 1, createdAt: 1 }) // sorted by line number and time
      .lean();

    return res.json({ success: true, translations: history });
  } catch (error) {
    console.error("Error fetching translation history:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
