import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { Languages, History, X, ChevronDown, ChevronUp } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootDispatch, RootState } from "../../store";
import { getTranslationHistory } from "../../store/slice/translationSlice";

interface SidebarProps {
  users: Array<{
    name: string;
    language: string;
    socketId?: string;
    clientId?: string;
  }>;
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
  detectedCommentsCount: number;
  onTranslate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  users,
  user,
  translations,
  isTranslating,
  translationProgress,
  setIsHistoryOpen,
  detectedCommentsCount,
  onTranslate,
}) => {
  const dispatch: RootDispatch = useDispatch();

  console.log("Sidebar render with users:", users);
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

  const toggleHistory = () => {
    if (!showHistory && history.length === 0) {
      handleGetTranslationHistory();
    } else {
      setShowHistory(!showHistory);
      setIsHistoryOpen(!showHistory);
    }
  };

  return (
    <aside className="w-72 bg-[#191919] border-r border-white/[0.06] overflow-y-auto flex flex-col">
      {/* Header Section */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">
          Workspace
        </h3>
        <div className="text-sm font-medium text-white/90">
          Active Users · {users.length}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 px-3 py-4 space-y-4">
        {/* Users Section */}
        <div className="space-y-1.5">
          {/* Current user */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="group relative px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-all duration-200 cursor-default"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-medium text-sm text-white/90 truncate">
                    {user?.name}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-400 bg-blue-500/10 rounded">
                    You
                  </span>
                </div>
                <div className="text-xs text-white/40">{user?.language}</div>
              </div>
            </div>
          </motion.div>

          {/* Other users */}
          {users
            .filter((u) => u.clientId !== user?.clientId)
            .map((u, index) => (
              <motion.div
                key={u.clientId || index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                  delay: index * 0.05,
                }}
                className="group relative px-3 py-2.5 hover:bg-white/[0.04] rounded-lg transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-white/80 truncate mb-0.5">
                      {u.name}
                    </div>
                    <div className="text-xs text-white/35">{u.language}</div>
                  </div>
                </div>
              </motion.div>
            ))}

          {users.filter((u) => u.clientId !== user?.clientId).length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-3 py-8 text-center"
            >
              <div className="text-xs text-white/25 font-medium">
                Waiting for others to join...
              </div>
            </motion.div>
          )}
        </div>

        {/* Translate Button */}
        <AnimatePresence>
          {detectedCommentsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-2"
            >
              <button
                onClick={onTranslate}
                disabled={isTranslating}
                className="w-full group relative px-4 py-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/15 hover:to-purple-500/15 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden border border-violet-500/20 hover:border-violet-500/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Languages className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform duration-200" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                        {isTranslating
                          ? "Translating..."
                          : "Translate Comments"}
                      </span>
                      <span className="text-[10px] text-white/40 font-medium">
                        {detectedCommentsCount} comment
                        {detectedCommentsCount !== 1 ? "s" : ""} found
                      </span>
                    </div>
                  </div>
                  {!isTranslating && (
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-violet-400">
                        {detectedCommentsCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Shine effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation info */}
        <AnimatePresence>
          {translationCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="px-3 py-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h3 className="text-xs font-semibold text-white/90 tracking-tight">
                  Active Translations
                </h3>
              </div>
              <div className="pl-8 space-y-1">
                <div className="text-xs text-white/50">
                  {translationCount} comment{translationCount !== 1 ? "s" : ""}{" "}
                  translated
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                  <div className="text-xs text-emerald-400/80 font-medium">
                    Ready to view
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translation History Section */}
        <div className="space-y-3">
          <button
            onClick={toggleHistory}
            disabled={loading}
            className="w-full group relative px-3 py-2.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2.5">
              {history.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-white/40 px-1.5 py-0.5 bg-white/5 rounded">
                    {history.length}
                  </span>
                  {showHistory ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </div>
              )}
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <div className="text-xs text-red-400 font-medium">{error}</div>
            </motion.div>
          )}

          {/* History List */}
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
              >
                {history.map((item: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-lg p-3 border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                  >
                    {/* Line number badge */}
                    {item.line !== undefined && (
                      <div className="mb-2">
                        <span className="inline-block px-2 py-0.5 rounded bg-white/5 border border-white/5">
                          <span className="text-gray-500 font-mono text-[10px] font-medium tracking-wider">
                            LINE {item.line + 1}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Original Text */}
                    <div className="mb-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <span className="text-gray-500 text-[9px] font-medium uppercase tracking-widest">
                          Original
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed pl-2.5">
                        {item.originalText}
                      </p>
                    </div>

                    {/* Translation */}
                    <div className="space-y-1 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                        <span className="text-blue-400 text-[9px] font-medium uppercase tracking-widest">
                          Translation
                        </span>
                      </div>
                      <p className="text-blue-200 text-xs leading-relaxed pl-2.5 font-medium">
                        {item.translatedText || item.text}
                      </p>
                    </div>

                    {/* Timestamp if available */}
                    {item.timestamp && (
                      <div className="mt-2 pt-2 border-t border-white/5">
                        <span className="text-[9px] text-white/30 font-medium">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <AnimatePresence>
          {isTranslating && translationProgress > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="px-3 py-3 bg-white/[0.02] rounded-lg border border-white/[0.04]"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs text-white/60 font-medium">
                  Translating
                </span>
                <span className="text-xs text-violet-400 font-semibold tabular-nums">
                  {translationProgress}%
                </span>
              </div>
              <div className="relative w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${translationProgress}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 rounded-full"
                />
                {/* Shimmer effect */}
                <motion.div
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{ width: "50%" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
};
