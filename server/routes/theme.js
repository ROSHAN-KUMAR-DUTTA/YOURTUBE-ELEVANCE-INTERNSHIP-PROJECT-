import express from "express";
import { getTheme } from "../controllers/themeController.js";

const routes = express.Router();

routes.get("/:id", getTheme);

export default routes;
