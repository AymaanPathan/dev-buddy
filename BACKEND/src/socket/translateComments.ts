import { Socket } from "socket.io";
import { LingoDotDevEngine } from "lingo.dev/sdk";

const lingo = new LingoDotDevEngine({
  apiKey: process.env.LINGO_API_KEY!,
});

export const translateComments = (socket: Socket) => {
  socket.on(
    "translate:batch",
    async (data: {
      texts: string[];
      targetLanguage: string;
      sourceLanguage?: string;
      roomId: string;
    }) => {
      try {
        const { texts, targetLanguage, sourceLanguage = "auto", roomId } = data;

        if (!texts || !Array.isArray(texts) || !targetLanguage) {
          socket.emit("translate:error", {
            error: "Missing required fields: texts (array), targetLanguage",
          });
          return;
        }

        console.log(`🌐 Starting translation of ${texts.length} texts...`);

        // Send start event
        socket.emit("translate:start", {
          total: texts.length,
        });

        // Translate each text and emit progress
        for (let i = 0; i < texts.length; i++) {
          try {
            const translatedText = await lingo.localizeText(texts[i], {
              sourceLocale: sourceLanguage === "auto" ? null : sourceLanguage,
              targetLocale: targetLanguage,
            });

            // Emit each translation as it completes (chunk by chunk)
            socket.emit("translate:chunk", {
              index: i,
              originalText: texts[i],
              translatedText,
              success: true,
              progress: Math.round(((i + 1) / texts.length) * 100),
            });
          } catch (err: any) {
            console.error(`Translation failed for text ${i}:`, err);
            socket.emit("translate:chunk", {
              index: i,
              originalText: texts[i],
              translatedText: texts[i], // fallback to original
              success: false,
              error: err.message,
              progress: Math.round(((i + 1) / texts.length) * 100),
            });
          }
        }

        // Send completion event
        socket.emit("translate:complete", {
          total: texts.length,
          message: "Translation completed",
        });

        console.log(`✅ Translation batch completed`);
      } catch (error: any) {
        console.error("❌ Batch translation error:", error);
        socket.emit("translate:error", {
          error: "Batch translation failed",
          message: error.message,
        });
      }
    }
  );
};
