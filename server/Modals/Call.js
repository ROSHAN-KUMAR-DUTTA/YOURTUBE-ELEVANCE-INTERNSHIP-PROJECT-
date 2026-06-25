import mongoose from "mongoose";

const CallSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    recordingName: {
      type: String, // Filename if recorded
    },
  },
  { timestamps: true }
);

export default mongoose.model("Call", CallSchema);
