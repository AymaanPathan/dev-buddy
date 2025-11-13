import express from "express";
import { createRoom } from "../../controllers/Rooms/createRoom.controller";

const router = express.Router();

router.post("/create-room", createRoom);

export default router;
