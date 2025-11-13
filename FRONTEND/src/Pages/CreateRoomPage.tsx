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
    await dispatch(
      createRoom({ name: displayName, language: preferredLanguage })
    );
    if (roomId) {
      navigate(`/lobby/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#191919] text-gray-100">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />

      <div className="relative">
        {/* Header */}
        <header className="border-b border-white/[0.08] bg-[#191919]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-base">CodeBridge</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-2xl mx-auto px-6 py-24">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm text-blue-400 mb-4">
              <Zap className="w-3.5 h-3.5" />
              <span>Create your workspace</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight">
              Start a new room
            </h1>

            <p className="text-lg text-gray-400 max-w-md mx-auto leading-relaxed">
              Set up your collaborative space in seconds. Code together in your
              native language.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#1f1f1f] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
            <div className="p-10 space-y-8">
              {/* Display Name */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3.5 bg-[#141414] border border-white/[0.06] rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-[#1a1a1a] transition-all duration-200 text-[15px]"
                />
              </div>

              {/* Preferred Language */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  Preferred language
                </label>
                <div className="relative">
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#141414] border border-white/[0.06] rounded-xl text-gray-100 focus:outline-none focus:border-blue-500/50 focus:bg-[#1a1a1a] transition-all duration-200 appearance-none cursor-pointer text-[15px]"
                  >
                    <option value="" disabled>
                      Select your language
                    </option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang} className="bg-[#1f1f1f]">
                        {lang}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500"
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

              {/* Create Button */}
              <button
                onClick={handleCreateRoom}
                disabled={!displayName || !preferredLanguage || loading}
                className="w-full px-6 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 disabled:shadow-none disabled:text-gray-500 text-[15px] group mt-2"
              >
                <span>{loading ? "Creating..." : "Create room"}</span>
                {!loading && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            </div>

            {/* Footer Info */}
            <div className="px-10 py-6 bg-[#141414] border-t border-white/[0.06]">
              <div className="flex items-start gap-8 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-300 mb-0.5">
                      Instant collaboration
                    </div>
                    <div className="text-gray-500 text-xs leading-relaxed">
                      Share room link with your team
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Globe2 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-300 mb-0.5">
                      Multilingual support
                    </div>
                    <div className="text-gray-500 text-xs leading-relaxed">
                      Code in your language
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Have a room ID?{" "}
              <a
                href="/join"
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Join existing room
              </a>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateRoomPage;
