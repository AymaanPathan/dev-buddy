import express from "express";
import { createRoom } from "../../../controllers/Rooms/createRoom.controller";
import { joinRoom } from "../../../controllers/Rooms/joinRoom.controller";
import { getRoomStateController } from "../../../controllers/Rooms/getRoomState.controller";
import { leaveRoomController } from "../../../controllers/Rooms/leaveRoom.controller";

const router = express.Router();

router.get("/:roomId/", getRoomStateController);
router.post("/create-room", createRoom);
router.post("/:roomId/join", joinRoom);
router.post("/:roomId/leave", leaveRoomController);

export default router;
