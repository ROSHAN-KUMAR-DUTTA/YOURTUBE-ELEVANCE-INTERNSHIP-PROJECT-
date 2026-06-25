import express from "express";
import { login, updateprofile, getUserById, manualLogin, verifyOtp, getAllUsers, subscribeChannel } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.patch("/update/:id", updateprofile);
routes.get("/:id", getUserById);
routes.post("/login-manual", manualLogin);
routes.post("/verify-otp", verifyOtp);

routes.get("/", getAllUsers);
routes.post("/subscribe/:channelId", subscribeChannel);
export default routes;