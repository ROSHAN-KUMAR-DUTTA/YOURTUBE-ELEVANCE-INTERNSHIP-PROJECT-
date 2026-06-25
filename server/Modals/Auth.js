import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  state: { type: String },
  mobile: { type: String },
  password: { type: String },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  subscribedChannels: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  otp: { type: String },
  otpExpiry: { type: Date },
  isVerified: { type: Boolean, default: false },
  joinedon: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false },
  premiumSince: { type: Date },
  razorpayCustomerId: { type: String },
  paymentHistory: [{
    orderId: String,
    paymentId: String,
    amount: Number,
    currency: String,
    status: String,
    date: { type: Date, default: Date.now }
  }],
  downloadsToday: { type: Number, default: 0 },
  lastDownloadDate: { type: String, default: "" },
  downloads: [{ type: mongoose.Schema.Types.ObjectId, ref: "Download" }],
  currentPlan: { type: String, enum: ["Free", "Bronze", "Silver", "Gold"], default: "Free" },
  watchLimit: { type: Number, default: 300 }, // 300 seconds = 5 minutes for Free
  subscriptionStartDate: { type: Date },
  subscriptionEndDate: { type: Date },
  watchTimeAccumulatedToday: { type: Number, default: 0 },
  lastWatchDate: { type: String, default: "" },
  invoices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }]
});

export default mongoose.model("user", userschema);