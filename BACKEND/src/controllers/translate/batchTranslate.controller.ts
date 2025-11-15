import axios from "axios";
import { Request, Response } from "express";
import { LingoDotDevEngine } from "lingo.dev/sdk";

const lingo = new LingoDotDevEngine({
  apiKey: process.env.LINGO_API_KEY!,
});

export const batchTranslateController = async (req: Request, res: Response) => {
  try {
    const { texts, targetLanguage, sourceLanguage = "auto" } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: texts (array), targetLanguage",
      });
    }

    const translations = await Promise.all(
      texts.map(async (text: string) => {
        try {
          const translatedText = await lingo.localizeText(text, {
            sourceLocale: sourceLanguage === "auto" ? null : sourceLanguage,
            targetLocale: targetLanguage,
          });
          return { originalText: text, translatedText, success: true };
        } catch (err: any) {
          return {
            originalText: text,
            translatedText: text,
            success: false,
            error: err.message,
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      translations,
    });
  } catch (error: any) {
    console.error("❌ Batch translation error:", error);
    return res.status(500).json({
      success: false,
      error: "Batch translation failed",
      message: error.message,
    });
  }
};
