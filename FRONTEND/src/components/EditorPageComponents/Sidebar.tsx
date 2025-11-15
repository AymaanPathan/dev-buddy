import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Languages, History, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootDispatch, RootState } from "../../store";
import { getTranslationHistory } from "../../store/slice/translationSlice";

interface SidebarProps {
  users: Array<{ name: string; language: string; socketId?: string }>;
  user: {
    name: string;
    language: string;
    socketId?: string;
    clientId?: string;
    roomId?: string;
  } | null;
  translations: Record<number, string>;
  isTranslating: boolean;
  translationProgress: number;
  setIsHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  users,
  user,
  translations,
  isTranslating,
  translationProgress,
  setIsHistoryOpen,
}) => {
  const dispatch: RootDispatch = useDispatch();
  const { loading, error, history } = useSelector(
    (state: RootState) => state.translation
  );

  const translationCount = Object.keys(translations).length;
  const [showHistory, setShowHistory] = React.useState(false);

  const handleGetTranslationHistory = async () => {
    if (!user?.roomId || !user?.clientId) {
      console.error("Missing roomId or clientId");
      return;
    }

    try {
      await dispatch(
        getTranslationHistory({
          roomId: user.roomId,
          clientId: user.clientId,
        })
      ).unwrap();
      setShowHistory(true);
      setIsHistoryOpen(true);
    } catch (err) {
      console.error("Failed to load translation history:", err);
    }
  };

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

        {users.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-[13px]">
            No other users yet
          </div>
        )}
      </div>

      {/* Translation info */}
      <AnimatePresence>
        {translationCount > 0 && (
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
              {translationCount} comment(s) translated
            </div>
            <div className="text-[12px] text-violet-400">
              Updates automatically
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translation History Button */}
      <div className="mt-5 pt-5 border-t border-white/6">
        <button
          onClick={handleGetTranslationHistory}
          disabled={loading || !user?.roomId || !user?.clientId}
          className="w-full p-2.5 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 hover:border-violet-500/30 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <div className="flex items-center justify-center gap-2">
            <History className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
            <span className="text-[13px] font-medium text-violet-300">
              {loading ? "Loading..." : "Load History"}
            </span>
          </div>
        </button>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-[11px] text-red-400 text-center"
          >
            {error}
          </motion.div>
        )}
      </div>

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
                className="bg-gradient-to-r from-violet-500 to-purple-500 h-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
