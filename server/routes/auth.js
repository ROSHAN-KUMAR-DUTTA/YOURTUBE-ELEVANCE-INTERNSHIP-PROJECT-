import express from "express";
import { login, updateprofile, getUserById, manualLogin, verifyOtp, getAllUsers, subscribeChannel, updateCity } from "../controllers/auth.js";

const routes = express.Router();

routes.post("/login", login);
routes.post("/login-manual", manualLogin);
routes.post("/verify-otp", verifyOtp);
routes.post("/subscribe/:channelId", subscribeChannel); // ✅ moved BEFORE /:id
routes.patch("/update/:id", updateprofile);
routes.get("/", getAllUsers);
routes.patch("/update-city/:id", updateCity);
routes.get("/:id", getUserById); // 

export default routes;