import { Socket, Server } from "socket.io";
import { lingo } from "../../src/utils/tran.util";
import crypto from "crypto";
import { TranslationCacheModel } from "../schema/TranslationCache.model";

export const newComment = (io: Server, socket: Socket) => {
  socket.on("new-comment", async (payload) => {
    const { text, line, senderId, roomId } = payload;

    if (!text || !roomId || !senderId) {
      console.warn("⚠️ Invalid comment payload:", { text, roomId, senderId });
      return;
    }

    // Broadcast original comment to all users
    io.in(roomId).emit("comment:new", {
      text,
      line,
      senderId,
      roomId,
    });

    try {
      const clients = await io.in(roomId).fetchSockets();

      await Promise.all(
        clients.map(async (clientSocket) => {
          try {
            const targetLanguage = clientSocket.data.language || "en";
            const sourceLanguage = "auto";

            const hash = crypto
              .createHash("sha256")
              .update(`${text}:${targetLanguage}:${roomId}:${clientSocket.id}`)
              .digest("hex");

            const cached = await TranslationCacheModel.findOne({ hash });
            let translatedText = cached?.translatedText;
            let fromCache = !!cached;

            if (!translatedText) {
              try {
                translatedText = await lingo.localizeText(text, {
                  sourceLocale:
                    sourceLanguage === "auto" ? null : sourceLanguage,
                  targetLocale: targetLanguage,
                });

                await TranslationCacheModel.create({
                  hash,
                  originalText: text,
                  targetLang: targetLanguage,
                  translatedText,
                  roomId,
                  clientId: clientSocket.id,
                }).catch((cacheErr) => {
                  console.error(
                    "Failed to save translation cache:",
                    cacheErr.message
                  );
                });

                fromCache = false;
              } catch (err: any) {
                console.error(
                  `❌ Translation failed for client ${clientSocket.id}:`,
                  err.message
                );
                translatedText = text; // fallback
              }
            }

            clientSocket.emit("comment:translated", {
              text: translatedText,
              line,
              originalText: text,
              senderId,
              fromCache,
            });
          } catch (clientErr: any) {
            console.error(
              `❌ Error processing comment for client ${clientSocket.id}:`,
              clientErr.message
            );

            clientSocket.emit("comment:translated", {
              text,
              line,
              originalText: text,
              senderId,
              error: true,
            });
          }
        })
      );
    } catch (err: any) {
      console.error("❌ Error broadcasting comment translations:", err);
    }
  });
};
