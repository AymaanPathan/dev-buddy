// controllers/translation.controller.ts
import { Request, Response } from "express";
import { TranslationCacheModel } from "../../schema/TranslationCache.model";

export const getTranslationHistoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const { roomId, clientId } = req.body;

    if (!roomId) {
      return res.status(400).json({ success: false, error: "Missing roomId" });
    }
    if (!clientId) {
      return res
        .status(400)
        .json({ success: false, error: "Missing clientId" });
    }

    const history = await TranslationCacheModel.find({
      roomId,
      clientId,
    }).lean();

    return res.json({ success: true, translations: history });
  } catch (error) {
    console.error("Error fetching translation history:", error);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
