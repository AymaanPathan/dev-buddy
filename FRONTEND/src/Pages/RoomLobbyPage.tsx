/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/RoomLobbyPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Copy,
  Check,
  Users,
  Play,
  Sparkles,
  Code2,
  Globe2,
} from "lucide-react";
import type { RootState } from "../store";
import {
  connectSocket,
  emitStartSession,
  getSocket,
  joinRoom,
  removeAllListeners,
} from "../services/socket";

interface LobbyUser {
  clientId: string | undefined;
  name: string;
  language: string;
  programmingLanguage?: string;
  socketId: string;
}

const RoomLobbyPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.room);

  const [users, setUsers] = useState<LobbyUser[]>([]);
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const handleUserList = (data: any) => {
    const usersArray = Array.isArray(data) ? data : [data];

    const mappedUsers: LobbyUser[] = usersArray.map((u, idx) => ({
      name: u.name,
      language: u.language,
      programmingLanguage: u.programmingLanguage,
      socketId: u.socketId || `client-${u.clientId}`,
      clientId: u.clientId,
    }));

    setUsers(mappedUsers);

    // Use clientId instead of socketId
    setIsCreator(mappedUsers[0]?.clientId === user?.clientId);
  };

  useEffect(() => {
    if (!roomId || !user) {
      navigate("/");
      return;
    }

    const socket = connectSocket();

    // Join room via socket
    joinRoom(roomId, user.name, user.language, user.clientId);

    // Listen for room users update
    socket.on("room-users-list", handleUserList);
    socket.on("room-users-update", handleUserList);
    // Listen for session start
    socket.on("session-started", () => {
      console.log("Session started! Navigating to editor...");
      navigate(`/room/${roomId}/editor`);
    });

    return () => {
      removeAllListeners();
    };
  }, [roomId, user, navigate]);

  const copyRoomLink = () => {
    const link = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startSession = () => {
    console.log("Starting session...", roomId);
    if (roomId) {
      emitStartSession(roomId);
    }
    navigate(`/room/${roomId}/editor`);
  };

  useEffect(() => {
    console.log("Is users:", users);
  }, [users]);

  return (
    <div className="min-h-screen bg-[#191919] text-gray-100">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]" />

      <div className="relative">
        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-6 py-16">
          {/* Status Badge */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm text-green-400 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Room Active</span>
            </div>

            <h1 className="text-4xl font-bold mb-3">
              {isCreator ? "Your Room is Ready!" : "Joined Successfully!"}
            </h1>
            <p className="text-gray-400">
              {isCreator
                ? "Share the link below with your team to collaborate"
                : "Waiting for the host to start the session..."}
            </p>
          </div>

          {/* Room Link Card */}
          <div className="bg-[#1f1f1f] border border-white/[0.08] rounded-2xl p-8 mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Room Link
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={`${window.location.origin}/room/${roomId}`}
                readOnly
                className="flex-1 px-4 py-3 bg-[#141414] border border-white/[0.06] rounded-xl text-gray-300 text-sm font-mono"
              />
              <button
                onClick={copyRoomLink}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 Share this link with your team members to invite them to
                collaborate
              </p>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-[#1f1f1f] border border-white/[0.08] rounded-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold">
                Active Members ({users?.length})
              </h3>
            </div>

            <div className="space-y-3">
              {users?.map((u, idx) => (
                <div
                  key={u.socketId || `user-${idx}`}
                  className="flex items-center justify-between p-4 bg-[#141414] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {u?.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white flex items-center gap-2 flex-wrap">
                        <span className="truncate">{u?.name}</span>
                        {idx === 0 && (
                          <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs rounded whitespace-nowrap">
                            Host
                          </span>
                        )}
                        {u?.socketId === getSocket()?.id && (
                          <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs rounded whitespace-nowrap">
                            You
                          </span>
                        )}
                      </div>

                      {/* Language and Programming Language Display */}
                      <div className="flex items-center gap-3 mt-1.5 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Globe2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>{u?.language}</span>
                        </div>
                        {u?.programmingLanguage && (
                          <>
                            <span className="text-gray-600">•</span>
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <Code2 className="w-3.5 h-3.5 text-violet-400" />
                              <span>{u?.programmingLanguage}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 ml-3" />
                </div>
              ))}

              {users?.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No users yet. Share the link to invite collaborators.</p>
                </div>
              )}
            </div>
          </div>

          {/* Start Button (Only for Creator) */}
          {isCreator && (
            <button
              onClick={startSession}
              disabled={users?.length < 1}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 disabled:shadow-none text-lg"
            >
              <Play className="w-5 h-5" />
              <span>Start Coding Session</span>
            </button>
          )}

          {!isCreator && (
            <div className="text-center p-6 bg-[#1f1f1f] border border-white/[0.08] rounded-xl">
              <div className="w-12 h-12 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-violet-400" />
              </div>
              <p className="text-gray-400">
                Waiting for host to start the session...
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RoomLobbyPage;
