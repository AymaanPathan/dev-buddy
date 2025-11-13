import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import { Room } from "./utils/types/Room.type";
import { registerSocketEvents } from "./socket";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("🚀 Express + TypeScript backend is running!");
});

const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: { origin: "*" }, // allow all for hackathon
});

export const rooms: Record<string, Room> = {};

registerSocketEvents(io);

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
