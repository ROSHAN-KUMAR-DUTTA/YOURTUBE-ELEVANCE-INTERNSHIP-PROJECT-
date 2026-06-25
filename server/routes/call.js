import express from "express";
import { saveCallHistory, getCallHistory } from "../controllers/call.js";

const router = express.Router();

router.post("/save", saveCallHistory);
router.get("/history/:userId", getCallHistory);

export default router;
