import express from "express";
import {
  handlelike,
  getallLikedVideo,
  getReactionStatus,
} from "../controllers/like.js";

const routes = express.Router();
routes.get("/status/:videoId/:userId", getReactionStatus);
routes.get("/:userId", getallLikedVideo);
routes.post("/:videoId", handlelike);
export default routes;