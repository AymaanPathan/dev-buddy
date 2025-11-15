import express from "express";
import { translateController } from "../../../controllers/translate/translate.controller";
import { batchTranslateController } from "../../../controllers/translate/batchTranslate.controller";

const router = express.Router();

router.post("/translate", translateController);
router.post("/batch", batchTranslateController);

export default router;
