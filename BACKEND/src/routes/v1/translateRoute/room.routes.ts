import express from "express";
import { translateController } from "../../../controllers/translate/translate.controller";
import { batchTranslateController } from "../../../controllers/translate/batchTranslate.controller";
import { getTranslationHistoryController } from "../../../controllers/translate/getTranslationHistroy.controller";

const router = express.Router();

router.post("/translate", translateController);
router.post("/batch", batchTranslateController);
router.post("/history", getTranslationHistoryController);

export default router;
