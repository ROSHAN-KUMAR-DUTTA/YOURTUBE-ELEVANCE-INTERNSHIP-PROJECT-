import express from "express";
import { downloadVideo, createOrder, verifyPayment, getUserDownloads, deleteDownload } from "../controllers/download.js";

const routes = express.Router();

routes.post("/payment/create", createOrder);
routes.post("/payment/verify", verifyPayment);
routes.get("/user/:userId", getUserDownloads);
routes.delete("/:id", deleteDownload);
routes.post("/:videoId", downloadVideo);

export default routes;
