import { Server, Socket } from "socket.io";
import { joinRoom } from "./joinRoom";
import { codeChange } from "./codeChange";
import { cursorMove } from "./cursorMove";
import { disconnect } from "./disconnect";
import { startSession } from "./startSession";
import { registerTranslateHandler } from "./translateBatch";
import { newComment } from "./newComment";

export const registerSocketEvents = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("New user connected:", socket.id);

    joinRoom(io, socket); // <-- pass io here
    startSession(socket);
    codeChange(io, socket);
    cursorMove(socket);
    newComment(io, socket);
    registerTranslateHandler(io, socket);
    disconnect(socket);
  });
};
