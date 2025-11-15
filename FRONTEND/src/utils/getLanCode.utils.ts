export function getLanguageCode(language: string): string {
  const languageMap: { [key: string]: string } = {
    javascript: "en",
    typescript: "en",
    python: "en",
    java: "en",
    cpp: "en",
    c: "en",
    spanish: "es",
    french: "fr",
    german: "de",
    chinese: "zh",
    japanese: "ja",
    korean: "ko",
    arabic: "ar",
    hindi: "hi",
    portuguese: "pt",
    russian: "ru",
    italian: "it",
  };

  return languageMap[language.toLowerCase()] || "en";
}
