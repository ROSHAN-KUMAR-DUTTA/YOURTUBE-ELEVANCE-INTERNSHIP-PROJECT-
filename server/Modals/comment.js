import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    videoid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videofiles",
      required: true,
    },

    commentbody: {
      type: String,
      required: true,
      trim: true,
    },

    usercommented: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      default: "Unknown",
    },

    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    likedBy: {
      type: [String],
      default: [],
    },

    dislikedBy: {
      type: [String],
      default: [],
    },

    // ✅ FIXED: use Object instead of Map (no crash, works with $set)
    translations: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("comment", commentSchema);