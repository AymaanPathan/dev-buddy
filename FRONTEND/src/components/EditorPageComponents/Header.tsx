import { AnimatePresence, motion } from "framer-motion";
import { Languages, Sparkles, Users } from "lucide-react";
import React from "react";

interface HeaderProps {
  roomId: string;
  users: Array<{ name: string; language: string; socketId?: string }>;
  isTranslating: boolean;
  translationProgress: number;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  users,
  isTranslating,
  translationProgress,
}) => {
  return (
    <header className="h-[52px] bg-[#202020]/80 backdrop-blur-xl border-b border-white/8 flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          {/* <div className="w-6 h-6 bg-linear-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div> */}
          <h1 className="text-white/95 font-semibold text-[15px] tracking-tight">
            CodeBuddy
          </h1>
        </div>
        <div className="text-[13px] text-gray-400">
          <span className="text-gray-500">Room:</span>{" "}
          <span className="font-mono text-gray-300">{roomId}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Active users */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#191919]/60 rounded-md border border-white/8 hover:border-white/12 transition-colors">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[13px] text-gray-300 font-medium">
            {users.length + 1}
          </span>
        </div>

        {/* Auto-translate indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-violet-500/8 border border-violet-500/15 rounded-md">
          <Languages className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[13px] text-violet-300 font-medium">
            Auto-translate
          </span>
        </div>

        {/* Translation status */}
        <AnimatePresence>
          {isTranslating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[#191919]/60 rounded-md border border-white/[0.08]"
            >
              <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              <span className="text-[12px] text-gray-300 font-medium">
                {translationProgress}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
