import { Router } from "express";
import roomRoutes from "../roomRoutes/room.routes";
import translateRoutes from "../translateRoute/room.routes";
const router = Router();

router.use("/rooms", roomRoutes);
router.use("/translate", translateRoutes);
export default router;
