export function getLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    javascript: "en-US",
    typescript: "en-US",
    python: "en-US",
    java: "en-US",
    cpp: "en-US",
    c: "en-US",
    english: "en-US",

    spanish: "es-ES",
    french: "fr-FR",
    german: "de-DE",
    chinese: "zh-CN",
    japanese: "ja-JP",
    korean: "ko-KR",
    arabic: "ar-SA",
    hindi: "hi-IN",
    portuguese: "pt-PT",
    russian: "ru-RU",
    italian: "it-IT",
  };

  return languageMap[language.toLowerCase()] || "en-US";
}
