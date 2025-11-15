import express from "express";
import { createRoom } from "../../../controllers/Rooms/createRoom.controller";
import { joinRoom } from "../../../controllers/Rooms/joinRoom.controller";

const router = express.Router();

router.post("/create-room", createRoom);
router.post("/:roomId/join", joinRoom);

export default router;
