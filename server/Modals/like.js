import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "dislike"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// One reaction per user per video
likeSchema.index({ viewer: 1, videoid: 1 }, { unique: true });

export default mongoose.model("like", likeSchema);