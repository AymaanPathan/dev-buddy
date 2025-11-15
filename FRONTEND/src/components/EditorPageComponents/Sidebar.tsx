import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Languages } from "lucide-react";

interface SidebarProps {
  users: Array<{ name: string; language: string; socketId?: string }>;
  user: { name: string; language: string; socketId?: string } | null;
  translations: Map<number, string>;
  isTranslating: boolean;
  translationProgress: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  users,
  user,
  translations,
  isTranslating,
  translationProgress,
}) => {
  return (
    <aside className="w-64 bg-[#202020]/80 backdrop-blur-sm border-r border-white/8 p-4 overflow-y-auto">
      <h3 className="text-[13px] font-semibold text-gray-300 mb-3 tracking-tight">
        Active Users ({users.length + 1})
      </h3>
      <div className="space-y-2">
        {/* Current user */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 bg-blue-500/8 border border-blue-500/15 rounded-lg transition-all duration-200 hover:border-blue-500/25"
        >
          <div className="font-medium text-[13px] text-white/95 mb-0.5">
            {user?.name}{" "}
            <span className="text-blue-400 text-[12px]">(You)</span>
          </div>
          <div className="text-[12px] text-gray-400">{user?.language}</div>
        </motion.div>

        {/* Other users */}
        <AnimatePresence>
          {users.map((u, idx) => {
            return (
              <motion.div
                key={`${u.name}-${idx}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                className="p-2.5 bg-[#191919]/60 border border-white/8 rounded-lg transition-all duration-200 hover:border-white/12 hover:bg-[#1c1c1c]"
              >
                <div className="font-medium text-[13px] text-white/95 mb-0.5">
                  {u.name}
                </div>
                <div className="text-[12px] text-gray-400">{u.language}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {users.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-[13px]">
            No other users yet
          </div>
        )}
      </div>

      {/* Translation info */}
      <AnimatePresence>
        {translations.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-white/6"
          >
            <h3 className="text-[13px] font-semibold text-gray-300 mb-2 tracking-tight flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5" />
              Live Translations
            </h3>
            <div className="text-[12px] text-gray-400 mb-1">
              {translations.size} comment(s) translated
            </div>
            <div className="text-[12px] text-violet-400">
              Updates automatically
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <AnimatePresence>
        {isTranslating && translationProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-gray-400 font-medium">
                Translation Progress
              </span>
              <span className="text-[12px] text-violet-400 font-mono">
                {translationProgress}%
              </span>
            </div>
            <div className="w-full bg-[#191919] rounded-full h-1.5 overflow-hidden border border-white/6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${translationProgress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-linear-to-r from-violet-500 to-purple-500 h-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
