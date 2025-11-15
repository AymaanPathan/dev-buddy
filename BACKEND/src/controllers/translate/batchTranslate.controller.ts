import axios from "axios";
import { Request, Response } from "express";

const LINGO_API_KEY = process.env.LINGO_API_KEY || "your-lingo-api-key";
const LINGO_API_URL =
  process.env.LINGO_API_URL || "https://api.lingo.dev/v1/translate";

export const batchTranslateController = async (req: Request, res: Response) => {
  try {
    const { texts, targetLanguage, sourceLanguage = "auto" } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: texts (array), targetLanguage",
      });
    }

    console.log(
      `🌐 Batch translating ${texts.length} texts to ${targetLanguage}`
    );

    // Translate all texts in parallel
    const translationPromises = texts.map((text: string) =>
      axios
        .post(
          LINGO_API_URL,
          {
            text,
            target_language: targetLanguage,
            source_language: sourceLanguage,
          },
          {
            headers: {
              Authorization: `Bearer ${LINGO_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => ({
          originalText: text,
          translatedText: res.data.translated_text || res.data.text,
          success: true,
        }))
        .catch((err) => ({
          originalText: text,
          translatedText: text, // Return original if translation fails
          success: false,
          error: err.message,
        }))
    );

    const results = await Promise.all(translationPromises);

    console.log(
      `✅ Batch translation complete: ${
        results.filter((r) => r.success).length
      }/${results.length} successful`
    );

    return res.status(200).json({
      success: true,
      translations: results,
    });
  } catch (error: any) {
    console.error("❌ Batch translation error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Batch translation failed",
      message: error.message,
    });
  }
};
