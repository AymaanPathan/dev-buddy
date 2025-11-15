import React, { useState, useEffect } from "react";
import { Sparkles, Zap, Users, Globe2, ArrowRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootDispatch, RootState } from "../store";
import { createRoom } from "../store/slice/roomSlice";

const CreateRoomPage = () => {
  const dispatch: RootDispatch = useDispatch();
  const navigate = useNavigate();
  const { roomId, loading } = useSelector((state: RootState) => state.room);

  const [displayName, setDisplayName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");

  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Korean",
    "Portuguese",
    "Russian",
    "Arabic",
    "Hindi",
    "Italian",
  ];

  const handleCreateRoom = async () => {
    if (!displayName || !preferredLanguage) return;

    try {
      const result = await dispatch(
        createRoom({ name: displayName, language: preferredLanguage })
      ).unwrap();

      navigate(`/lobby/${result.roomId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#191919] text-white">
      {/* Notion-style subtle glow background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.08),transparent_50%)]" />

      <div className="relative">
        {/* Main Content with Notion spacing */}
        <main className="max-w-[720px] mx-auto px-8 py-16">
          {/* Elegant Hero Section */}
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-500/[0.08] border border-blue-500/[0.15] rounded-full text-[13px] text-blue-300 mb-3 font-medium tracking-tight">
              <Zap className="w-3 h-3" />
              <span>Create workspace</span>
            </div>

            <h1 className="text-[40px] font-semibold tracking-[-0.03em] leading-[1.1] text-white/95 mb-3">
              Start a new room
            </h1>

            <p className="text-[15px] text-gray-400 max-w-[480px] mx-auto leading-relaxed font-normal">
              Set up your collaborative coding space in seconds. Work together
              in your native language.
            </p>
          </div>

          {/* Notion-style Form Card with perfect spacing */}
          <div className="bg-[#202020]/80 border border-white/[0.08] rounded-xl shadow-2xl shadow-black/20 overflow-hidden transition-all duration-300 hover:shadow-black/40 hover:border-white/[0.12] backdrop-blur-sm">
            <div className="p-10 space-y-6">
              {/* Display Name with Notion input style */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-gray-300/90 tracking-tight">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 bg-[#191919]/60 border border-white/[0.08] rounded-lg text-[15px] text-white/95 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-[#1c1c1c] transition-all duration-200 hover:bg-[#1c1c1c]/80 hover:border-white/[0.12]"
                />
              </div>

              {/* Preferred Language with refined select */}
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-gray-300/90 tracking-tight">
                  Preferred language
                </label>
                <div className="relative">
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#191919]/60 border border-white/[0.08] rounded-lg text-[15px] text-white/95 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:bg-[#1c1c1c] transition-all duration-200 appearance-none cursor-pointer hover:bg-[#1c1c1c]/80 hover:border-white/[0.12]"
                  >
                    <option
                      value=""
                      disabled
                      className="bg-[#202020] text-gray-400"
                    >
                      Select your language
                    </option>
                    {languages.map((lang) => (
                      <option
                        key={lang}
                        value={lang}
                        className="bg-[#202020] text-white py-2"
                      >
                        {lang}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Premium Create Button */}
              <button
                onClick={handleCreateRoom}
                disabled={!displayName || !preferredLanguage || loading}
                className="w-full mt-6 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-[#2a2a2a] disabled:cursor-not-allowed text-white disabled:text-gray-500/80 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:shadow-xl disabled:shadow-none text-[15px] group"
              >
                <span>{loading ? "Creating..." : "Create room"}</span>
                {!loading && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300 ease-out" />
                )}
              </button>
            </div>

            {/* Elegant Info Footer */}
            <div className="px-10 py-7 bg-[#1a1a1a]/60 border-t border-white/6">
              <div className="flex items-start gap-10 text-[13px]">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-200 mb-1 text-[13px] tracking-tight">
                      Instant collaboration
                    </div>
                    <div className="text-gray-500 text-[12px] leading-relaxed">
                      Share your room link with teammates
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-200 mb-1 text-[13px] tracking-tight">
                      Multilingual support
                    </div>
                    <div className="text-gray-500 text-[12px] leading-relaxed">
                      Code in your preferred language
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subtle Bottom Link */}
        </main>

        {/* Notion-style bottom spacing */}
        <div className="h-20" />
      </div>
    </div>
  );
};

export default CreateRoomPage;
