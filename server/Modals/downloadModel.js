import mongoose from "mongoose";

const downloadSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: "videofiles", required: true },
  title: { type: String, required: true },
  thumbnail: { type: String },
  fileUrl: { type: String, required: true },
  duration: { type: String },
  downloadedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Download", downloadSchema);
