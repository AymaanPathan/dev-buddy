import { Request, Response } from "express";
import axios from "axios";
interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface TranslateResponse {
  translatedText: string;
  detectedLanguage?: string;
}

const LINGO_API_KEY = process.env.LINGO_API_KEY || "your-lingo-api-key";
const LINGO_API_URL =
  process.env.LINGO_API_URL || "https://api.lingo.dev/v1/translate";

export const translateController = async (req: Request, res: Response) => {
  try {
    const {
      text,
      targetLanguage,
      sourceLanguage = "auto",
    }: TranslateRequest = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: text, targetLanguage",
      });
    }

    console.log(
      `🌐 Translating: "${text.substring(0, 50)}..." to ${targetLanguage}`
    );

    // Call Lingo.dev API
    const response = await axios.post(
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
    );

    const translatedText = response.data.translated_text || response.data.text;
    const detectedLanguage = response.data.detected_language;

    console.log(
      `✅ Translation complete: "${translatedText.substring(0, 50)}..."`
    );

    return res.status(200).json({
      success: true,
      translatedText,
      detectedLanguage,
      originalText: text,
    });
  } catch (error: any) {
    console.error(
      "❌ Translation error:",
      error.response?.data || error.message
    );

    // Fallback to a free API if Lingo.dev fails
    try {
      console.log("🔄 Trying fallback translation API...");
      const fallbackResponse = await axios.get(
        `https://api.mymemory.translated.net/get`,
        {
          params: {
            q: req.body.text,
            langpair: `${req.body.sourceLanguage || "en"}|${
              req.body.targetLanguage
            }`,
          },
        }
      );

      const translatedText = fallbackResponse.data.responseData?.translatedText;

      if (translatedText) {
        console.log("✅ Fallback translation successful");
        return res.status(200).json({
          success: true,
          translatedText,
          originalText: req.body.text,
          usedFallback: true,
        });
      }
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
    }

    return res.status(500).json({
      success: false,
      error: "Translation failed",
      message: error.response?.data?.message || error.message,
    });
  }
};
