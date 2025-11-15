import axiosSetup from "../../../utils/axiosSetup";

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
  success: boolean;
}

export const gettranslateBatchApi = async (
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = "auto"
): Promise<TranslationResult[]> => {
  try {
    const response = await axiosSetup.post("/translate/batch", {
      texts,
      targetLanguage,
      sourceLanguage,
    });

    return response.data.translations;
  } catch (error) {
    console.error("Batch translation error:", error);
    return texts.map((text) => ({
      originalText: text,
      translatedText: text,
      success: false,
    }));
  }
};
