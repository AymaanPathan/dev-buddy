import { Server, Socket } from "socket.io";
import { joinRoom } from "./joinRoom";
import { codeChange } from "./codeChange";
import { cursorMove } from "./cursorMove";
import { disconnect } from "./disconnect";
import { startSession } from "./startSession";

export const registerSocketEvents = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log("New user connected:", socket.id);

    joinRoom(socket);
    startSession(socket);
    codeChange(socket);
    cursorMove(socket);
    disconnect(socket);
  });
};
