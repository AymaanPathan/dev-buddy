import { Request, Response } from "express";
import { lingo } from "../../utils/tran.util";

/**
 * Single text translation controller
 */
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

/**
 * Batch translation controller
 */
export const batchTranslateController = async (req: Request, res: Response) => {
  try {
    const { texts, targetLanguage, sourceLanguage = "auto" } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: texts (array), targetLanguage",
      });
    }

    // Use efficient batch translation
    try {
      const translations = await lingo.localizeTexts(texts, {
        sourceLocale: sourceLanguage === "auto" ? null : sourceLanguage,
        targetLocale: targetLanguage,
      });

      const results = texts.map((text, index) => ({
        originalText: text,
        translatedText: translations[index] || text,
        success: true,
      }));

      return res.status(200).json({
        success: true,
        translations: results,
      });
    } catch (batchError) {
      // Fallback to individual translations if batch fails
      console.warn(
        "Batch translation failed, falling back to individual:",
        batchError
      );

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
    }
  } catch (error: any) {
    console.error("❌ Batch translation error:", error);
    return res.status(500).json({
      success: false,
      error: "Batch translation failed",
      message: error.message,
    });
  }
};
