import express from "express";
import { deletecomment, getallcomment, postcomment, editcomment, reactToComment, translateComment } from "../controllers/comment.js";
import { sanitizeComment } from "../middleware/sanitize.js";

const routes = express.Router();
routes.get("/:videoid", getallcomment);
routes.post("/postcomment", sanitizeComment, postcomment);
routes.delete("/deletecomment/:id", deletecomment);
routes.post("/editcomment/:id", sanitizeComment, editcomment);
routes.post("/react/:id", reactToComment);
routes.post("/translate/:id", translateComment);
export default routes;