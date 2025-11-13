import { Router } from "express";
import roomRoutes from "../v1/room.routes";

const router = Router();

router.use("/rooms", roomRoutes);
export default router;
