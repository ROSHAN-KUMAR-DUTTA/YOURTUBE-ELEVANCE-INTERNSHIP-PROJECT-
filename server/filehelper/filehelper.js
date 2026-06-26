"use strict";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "yourtube_media",
    resource_type: "auto",
    allowed_formats: ["mp4", "webm", "mov", "avi", "jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage: storage });

export default upload;