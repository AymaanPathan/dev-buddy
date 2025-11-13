import React, { useState } from "react";
import {
  Code2,
  Users,
  Globe,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";

const RoomPage = () => {
  const [displayName, setDisplayName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);

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

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    setRoomId(newRoomId);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinRoom = () => {
    console.log("Joining room:", { roomId, displayName, preferredLanguage });
  };

  return (
    <div className="min-h-screen bg-[#191919] text-gray-100 font-sans antialiased">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#191919]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">DevBuddy</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
              Documentation
            </button>
            <button className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
              GitHub
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Real-time multilingual collaboration</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
            Code Together,
            <br />
            Speak Different Languages
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Break language barriers in development. Collaborate in real-time
            with automatic comment translation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <div className="bg-[#1f1f1f] rounded-xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Collaboration</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time code editing with multiple developers simultaneously
            </p>
          </div>
          <div className="bg-[#1f1f1f] rounded-xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Auto Translation</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Comments translated instantly into your preferred language
            </p>
          </div>
          <div className="bg-[#1f1f1f] rounded-xl p-6 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/5">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
              <Code2 className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Code Stays English</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Syntax remains standard while communication adapts to you
            </p>
          </div>
        </div>

        {/* Main Action Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#1f1f1f] rounded-2xl border border-gray-800/50 shadow-2xl overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Get Started</h2>

              {/* Display Name Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
                />
              </div>

              {/* Language Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Select your language
                  </option>
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={handleCreateRoom}
                  disabled={!displayName || !preferredLanguage}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:shadow-none"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Room
                </button>
                <button
                  onClick={handleJoinRoom}
                  disabled={!displayName || !preferredLanguage || !roomId}
                  className="px-6 py-3.5 bg-[#2a2a2a] hover:bg-[#333] disabled:bg-[#2a2a2a] disabled:cursor-not-allowed border border-gray-700/50 text-gray-200 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Join Room
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Room ID Display */}
              {roomId && (
                <div className="pt-6 border-t border-gray-800/50">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Enter room ID to join"
                      className="flex-1 px-4 py-3 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all font-mono"
                    />
                    <button
                      onClick={handleCopyRoomId}
                      className="px-4 py-3 bg-[#2a2a2a] hover:bg-[#333] border border-gray-700/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Share this ID with your collaborators
                  </p>
                </div>
              )}

              {/* Or Divider */}
              {!roomId && (
                <div className="pt-6 border-t border-gray-800/50">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Or join existing room
                  </label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="Enter room ID"
                    className="w-full px-4 py-3 bg-[#2a2a2a] border border-gray-700/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Built for developers, by developers. Open source and free to use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
