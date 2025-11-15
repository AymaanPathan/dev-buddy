import { Request, Response } from "express";
import { LingoDotDevEngine } from "lingo.dev/sdk";

const lingo = new LingoDotDevEngine({
  apiKey: process.env.LINGO_API_KEY!,
});

export const translateController = async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, sourceLanguage = "auto" } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: text, targetLanguage",
      });
    }

    const translatedText = await lingo.localizeText(text, {
      sourceLocale: sourceLanguage === "auto" ? null : sourceLanguage,
      targetLocale: targetLanguage,
    });

    return res.status(200).json({
      success: true,
      originalText: text,
      translatedText,
    });
  } catch (error: any) {
    console.error("❌ Translation error:", error);
    return res.status(500).json({
      success: false,
      error: "Translation failed",
      message: error.message,
    });
  }
};
