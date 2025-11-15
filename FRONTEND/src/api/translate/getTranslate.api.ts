import axiosSetup from "../../utils/axiosSetup";

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
  success: boolean;
}

export const getTranslateApi = async (
  text: string,
  targetLang: string
): Promise<TranslationResult> => {
  try {
    const response = await axiosSetup.post("/translate/translate", {
      text,
      targetLang,
    });

    return {
      originalText: text,
      translatedText: response.data.translatedText,
      detectedLanguage: response.data.detectedLanguage,
      success: true,
    };
  } catch (error) {
    console.error("Translation API error:", error);
    return {
      originalText: text,
      translatedText: text,
      success: false,
    };
  }
};
