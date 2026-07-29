import express from "express";
import { downloadVideo, getUserDownloads, deleteDownload } from "../controllers/download.js";

const routes = express.Router();

routes.get("/user/:userId", getUserDownloads);
routes.delete("/:id", deleteDownload);
routes.post("/:videoId", downloadVideo);

export default routes;
