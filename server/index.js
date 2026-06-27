import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import themeroutes from "./routes/theme.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import downloadroutes from "./routes/download.js";
import subscriptionRoutes from "./routes/subscription.js";
import videoTrackRoutes from "./routes/videoTrack.js";
import callRoutes from "./routes/call.js";
import { startCronJobs } from "./jobs/cron.js";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();
const httpServer = createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "https://yourtube-elevance-internship-projec.vercel.app"];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.get("/", (req, res) => {
  res.send("You tube backend is working");
});

app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/api/theme", themeroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/download", downloadroutes);
app.use("/subscription", subscriptionRoutes);
app.use("/videoTrack", videoTrackRoutes);
app.use("/call", callRoutes);

// Socket.io Signaling Logic
const activeUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    activeUsers.set(userId, socket.id);
  });

  socket.on("call-user", (data) => {
    const { userToCall, signalData, from, name, profilePic } = data;
    console.log(`[Socket] Call initiated from ${from} to ${userToCall}`);
    const receiverSocketId = activeUsers.get(userToCall);
    if (receiverSocketId) {
      console.log(`[Socket] Receiver found, emitting incoming-call to socket ${receiverSocketId}`);
      io.to(receiverSocketId).emit("incoming-call", { signal: signalData, from, name, profilePic });
    } else {
      console.log(`[Socket] Receiver ${userToCall} not found in activeUsers`);
    }
  });

  socket.on("answer-call", (data) => {
    const { to, signal } = data;
    const callerSocketId = activeUsers.get(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-answered", signal);
    }
  });

  socket.on("reject-call", (data) => {
    const { to } = data;
    const callerSocketId = activeUsers.get(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected");
    }
  });

  socket.on("ice-candidate", (data) => {
    const { to, candidate } = data;
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", candidate);
    }
  });

  socket.on("video-toggled", (data) => {
    const { to, isVideoOn } = data;
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("video-toggled", isVideoOn);
    }
  });

  socket.on("end-call", (data) => {
    const { to } = data;
    const targetSocketId = activeUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
  });
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ success: false, message, stack: process.env.NODE_ENV === "production" ? null : err.stack });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
  startCronJobs();
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });