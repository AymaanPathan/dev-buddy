import { Server, Socket } from "socket.io";
import crypto from "crypto";
import { LingoDotDevEngine } from "lingo.dev/sdk";
import { TranslationCacheModel } from "../schema/TranslationCache.model";

const lingo = new LingoDotDevEngine({ apiKey: process.env.LINGO_API_KEY! });

export const registerTranslateHandler = (io: Server, socket: Socket) => {
  socket.on("translate:batch", async (payload) => {
    try {
      const {
        texts,
        targetLanguage,
        sourceLanguage = "auto",
        roomId,
        clientId,
      } = payload;
      if (
        !texts ||
        !Array.isArray(texts) ||
        !targetLanguage ||
        !roomId ||
        !clientId
      ) {
        return socket.emit("translate:error", { error: "Invalid payload" });
      }

      const total = texts.length;
      socket.emit("translate:start", { total });

      // Process all translations in parallel
      const translationPromises = texts.map(async (text, i) => {
        const hash = crypto
          .createHash("sha256")
          .update(`${text}:${targetLanguage}:${roomId}:${clientId}`)
          .digest("hex");

        // Try DB cache first
        const cached = await TranslationCacheModel.findOne({ hash });
        if (cached) {
          socket.emit("translate:chunk", {
            index: i,
            originalText: text,
            translatedText: cached.translatedText,
            success: true,
            progress: Math.round(((i + 1) / total) * 100),
            fromCache: true,
          });
          return;
        }

        // Call Lingo for translation
        try {
          const translatedText = await lingo.localizeText(text, {
            sourceLocale: sourceLanguage === "auto" ? null : sourceLanguage,
            targetLocale: targetLanguage,
          });

          // Save translation to DB
          await TranslationCacheModel.create({
            hash,
            originalText: text,
            targetLang: targetLanguage,
            translatedText,
            roomId,
            clientId,
          });

          socket.emit("translate:chunk", {
            index: i,
            originalText: text,
            translatedText,
            success: true,
            progress: Math.round(((i + 1) / total) * 100),
            fromCache: false,
          });
        } catch (err: any) {
          socket.emit("translate:chunk", {
            index: i,
            originalText: text,
            translatedText: text,
            success: false,
            error: err?.message || "translate error",
            progress: Math.round(((i + 1) / total) * 100),
          });
        }
      });

      // Wait for all translations to finish
      await Promise.all(translationPromises);

      socket.emit("translate:complete", {
        total,
        message: "Translation finished",
      });
    } catch (err: any) {
      console.error("translate:batch error:", err);
      socket.emit("translate:error", { error: "Batch translation failed" });
    }
  });
};
