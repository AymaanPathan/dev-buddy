import { Socket, Server } from "socket.io";
import { lingo } from "../../src/utils/tran.util";
import { TranslationCacheModel } from "../schema/TranslationCache.model";
import crypto from "crypto";

/**
 * Register batch translation handler with Lingo CLI
 */
export const registerTranslateHandler = (io: Server, socket: Socket) => {
  socket.on(
    "translate:batch",
    async (payload: {
      texts: string[];
      roomId: string;
      clientId: string;
      lines?: number[];
    }) => {
      const { texts, roomId, clientId, lines } = payload;

      if (!texts || !roomId || !Array.isArray(texts)) {
        return socket.emit("translate:error", { error: "Invalid payload" });
      }

      try {
        const socketsInRoom = await io.in(roomId).fetchSockets();

        for (const s of socketsInRoom) {
          const targetLanguage = s.data.language || "en";
          const receiverClientId = s.data.clientId;
          const total = texts.length;

          s.emit("translate:start", { total });

          // Check cache for all texts first
          const cacheResults = await Promise.all(
            texts.map(async (text, i) => {
              const hash = `${text}:${targetLanguage}:${roomId}:${clientId}`;
              const cached = await TranslationCacheModel.findOne({ hash });
              return { index: i, text, cached, hash };
            })
          );

          // Separate cached and uncached
          const cached = cacheResults.filter((r) => r.cached);
          const uncached = cacheResults.filter((r) => !r.cached);

          // Emit cached results immediately
          for (const item of cached) {
            const lineNumber = lines?.[item.index] ?? -1;
            s.emit("translate:chunk", {
              senderClientId: clientId,
              receiverClientId: receiverClientId,
              index: item.index,
              line: lineNumber,
              originalText: item.text,
              translatedText: item.cached!.translatedText,
              success: true,
              progress: Math.round(((item.index + 1) / total) * 100),
              fromCache: true,
            });
          }

          // Batch translate uncached texts
          if (uncached.length > 0) {
            try {
              const textsToTranslate = uncached.map((u) => u.text);
              const translations = await lingo.localizeTexts(textsToTranslate, {
                sourceLocale: null,
                targetLocale: targetLanguage,
              });

              // Save to cache and emit
              for (let i = 0; i < uncached.length; i++) {
                const item = uncached[i];
                const translatedText = translations[i] || item.text;
                const lineNumber = lines?.[item.index] ?? -1;

                // Save in cache
                await TranslationCacheModel.create({
                  hash: item.hash,
                  originalText: item.text,
                  translatedText,
                  targetLang: targetLanguage,
                  roomId,
                  clientId,
                });

                s.emit("translate:chunk", {
                  senderClientId: clientId,
                  receiverClientId: receiverClientId,
                  index: item.index,
                  line: lineNumber,
                  originalText: item.text,
                  translatedText,
                  success: true,
                  progress: Math.round(((item.index + 1) / total) * 100),
                  fromCache: false,
                });
              }
            } catch (batchErr: any) {
              console.error(
                "Batch translation failed, trying individual:",
                batchErr
              );

              // Fallback: translate individually
              for (const item of uncached) {
                const lineNumber = lines?.[item.index] ?? -1;
                try {
                  const translatedText = await lingo.localizeText(item.text, {
                    sourceLocale: null,
                    targetLocale: targetLanguage,
                  });

                  await TranslationCacheModel.create({
                    hash: item.hash,
                    originalText: item.text,
                    translatedText,
                    targetLang: targetLanguage,
                    roomId,
                    clientId,
                  });

                  s.emit("translate:chunk", {
                    senderClientId: clientId,
                    receiverClientId: receiverClientId,
                    index: item.index,
                    line: lineNumber,
                    originalText: item.text,
                    translatedText,
                    success: true,
                    progress: Math.round(((item.index + 1) / total) * 100),
                    fromCache: false,
                  });
                } catch (err: any) {
                  s.emit("translate:chunk", {
                    senderClientId: clientId,
                    receiverClientId: receiverClientId,
                    index: item.index,
                    line: lineNumber,
                    originalText: item.text,
                    translatedText: item.text,
                    success: false,
                    error: err?.message || "translation error",
                    progress: Math.round(((item.index + 1) / total) * 100),
                  });
                }
              }
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

/**
 * Handle new comments with translation using Lingo CLI
 */
export const newComment = (io: any, socket: Socket) => {
  socket.on("new-comment", async (payload) => {
    const { text, line, senderId, roomId } = payload;
    if (!text || !roomId || !senderId) return;

    // Broadcast original comment to all users
    io.in(roomId).emit("comment:new", {
      text,
      line,
      senderId,
      roomId,
    });

    // Get all connected sockets in the room
    const clients = await io.in(roomId).fetchSockets();

    for (const clientSocket of clients) {
      const targetLanguage = clientSocket.data.language;
      const sourceLanguage = "auto";

      // Create a hash for caching
      const hash = crypto
        .createHash("sha256")
        .update(`${text}:${targetLanguage}:${roomId}:${clientSocket.id}`)
        .digest("hex");

      // Check cache
      const cached = await TranslationCacheModel.findOne({ hash });
      let translatedText = cached?.translatedText;

      if (!translatedText) {
        try {
          translatedText = await lingo.localizeText(text, {
            sourceLocale: sourceLanguage === "auto" ? null : sourceLanguage,
            targetLocale: targetLanguage,
          });

          // Save in cache
          await TranslationCacheModel.create({
            hash,
            originalText: text,
            targetLang: targetLanguage,
            translatedText,
            roomId,
            clientId: clientSocket.id,
          });
        } catch (err: any) {
          console.error("Translation error for comment:", err);
          translatedText = text; // fallback
        }
      }

      // Send translated comment to the specific client
      clientSocket.emit("comment:translated", {
        text: translatedText,
        line,
        originalText: text,
        senderId,
      });
    }
  });
};
