import { Router } from "express";
import roomRoutes from "../roomRoutes/room.routes";

const router = Router();

router.use("/rooms", roomRoutes);
export default router;
