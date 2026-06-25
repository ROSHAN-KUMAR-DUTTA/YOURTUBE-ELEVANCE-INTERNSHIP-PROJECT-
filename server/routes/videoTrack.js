import express from "express";
import { trackWatchTime } from "../controllers/videoTrack.js";

const router = express.Router();

router.post("/track", trackWatchTime);

export default router;
