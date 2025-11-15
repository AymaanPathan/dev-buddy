import { Router } from "express";
import translateRoutes from "../translateRoute/room.routes";

const router = Router();

router.use("/translate", translateRoutes);
export default router;
