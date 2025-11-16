import { Socket, Server } from "socket.io";
import { LingoDotDevEngine } from "lingo.dev/sdk";
import { TranslationCacheModel } from "../schema/TranslationCache.model";

const lingo = new LingoDotDevEngine({ apiKey: process.env.LINGO_API_KEY! });
export const registerTranslateHandler = (io: Server, socket: Socket) => {
  socket.on(
    "translate:batch",
    async (payload: {
      texts: string[];
      roomId: string;
      clientId: string;
      lines?: number[]; // ✅ Added
    }) => {
      const { texts, roomId, clientId, lines } = payload;
      if (!texts || !roomId || !Array.isArray(texts)) {
        return socket.emit("translate:error", { error: "Invalid payload" });
      }

      try {
        const socketsInRoom = await io.in(roomId).fetchSockets();

        for (const s of socketsInRoom) {
          const targetLanguage = s.data.language || "en";
          const receiverClientId = s.data.clientId; // ✅ Get RECEIVER's clientId
          const total = texts.length;

          s.emit("translate:start", { total });

          for (let i = 0; i < texts.length; i++) {
            const text = texts[i];
            const lineNumber = lines?.[i] ?? -1; // ✅ Get line number

            // Cache key should include RECEIVER's language
            const hash = `${text}:${targetLanguage}:${roomId}:${clientId}`;
            const cached = await TranslationCacheModel.findOne({ hash });

            if (cached) {
              s.emit("translate:chunk", {
                senderClientId: clientId, // ✅ Original sender
                receiverClientId: receiverClientId, // ✅ Current receiver
                index: i,
                line: lineNumber, // ✅ Include line
                originalText: text,
                translatedText: cached.translatedText,
                success: true,
                progress: Math.round(((i + 1) / total) * 100),
                fromCache: true,
              });
              continue;
            }

            try {
              const translatedText = await lingo.localizeText(text, {
                sourceLocale: null,
                targetLocale: targetLanguage,
              });

              await TranslationCacheModel.create({
                hash,
                originalText: text,
                translatedText,
                targetLang: targetLanguage,
                roomId,
                clientId,
              });

              s.emit("translate:chunk", {
                senderClientId: clientId, // ✅ Original sender
                receiverClientId: receiverClientId, // ✅ Current receiver
                index: i,
                line: lineNumber, // ✅ Include line
                originalText: text,
                translatedText,
                success: true,
                progress: Math.round(((i + 1) / total) * 100),
                fromCache: false,
              });
            } catch (err: any) {
              s.emit("translate:chunk", {
                senderClientId: clientId,
                receiverClientId: receiverClientId,
                index: i,
                line: lineNumber,
                originalText: text,
                translatedText: text,
                success: false,
                error: err?.message || "translation error",
                progress: Math.round(((i + 1) / total) * 100),
              });
            }
          }

          s.emit("translate:complete", {
            total,
            message: "Translation finished",
          });
        }
      } catch (err: any) {
        console.error("translate:batch error:", err);
        socket.emit("translate:error", { error: "Batch translation failed" });
      }
    }
  );
};
