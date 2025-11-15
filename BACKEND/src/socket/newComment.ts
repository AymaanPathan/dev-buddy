import { Socket } from "socket.io";
import { TranslationCacheModel } from "../schema/TranslationCache.model";
import crypto from "crypto";
import { LingoDotDevEngine } from "lingo.dev/sdk";

const lingo = new LingoDotDevEngine({ apiKey: process.env.LINGO_API_KEY! });

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

    clients.forEach(async (clientSocket: any) => {
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
    });
  });
};
