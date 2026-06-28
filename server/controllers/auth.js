import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "../utils/emailService.js";
import { sendOtpSms, verifyOtpSms } from "../utils/smsService.js";
import jwt from "jsonwebtoken";

const southStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];

export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      const token = jwt.sign({ email: newUser.email, id: newUser._id }, process.env.JWT_SECRET || "test", { expiresIn: "1h" });
      return res.status(201).json({ result: newUser, token });
    } else {
      const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, process.env.JWT_SECRET || "test", { expiresIn: "1h" });
      return res.status(200).json({ result: existingUser, token });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const allUsers = await users.find({}, "name email channelname profilePic desc state");
    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong..." });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    let user;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await users.findById(id);
    }
    if (!user) {
      // fallback to search by channelname
      user = await users.findOne({ channelname: new RegExp(`^${id}$`, "i") });
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const manualLogin = async (req, res) => {
  const { email, password, mobile, state, name, simulatedState } = req.body;
  try {
    let user = await users.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60000); // 5 mins

    if (!user) {
      if (!password || !mobile || !state) return res.status(400).json({ message: "All fields are required" });
      const hashedPassword = await bcrypt.hash(password, 12);
      user = await users.create({ 
        email, 
        password: hashedPassword, 
        name: name || "New User", 
        mobile, 
        state, 
        otp, 
        otpExpiry, 
        isVerified: false 
      });
    } else {
      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
      } else {
        return res.status(400).json({ message: "User registered via Google. Use Google Sign-in." });
      }
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.isVerified = false;
    }

    // IP Geolocation Fallback
    let currentState = simulatedState || user.state || state;
    if (!simulatedState) {
      try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipQuery = ip && ip !== '::1' && ip !== '127.0.0.1' ? `${ip}/` : '';
        const response = await fetch(`https://ip-api.com/json/${ipQuery}`);
        const data = await response.json();
        if (data && data.status === "success" && data.regionName) {
          currentState = data.regionName;
          user.state = currentState;
        } else {
          throw new Error("Invalid geolocation data received");
        }
      } catch (error) {
        console.error("[Location Fallback] IP Geolocation failed:", error.message);
        if (!currentState) {
          currentState = "Tamil Nadu"; // Predefined fallback
          user.state = currentState;
        }
      }
    } else {
       user.state = currentState;
    }
    
    await user.save();

    if (southStates.includes(user.state)) {
      await sendOtpEmail(user.email, otp);
      return res.status(200).json({ message: "OTP sent to Email", userId: user._id, method: "email" });
    } else {
      const smsSent = await sendOtpSms(user.mobile, otp);
      if (!smsSent) {
        console.warn("SMS sending failed, falling back to Email");
        await sendOtpEmail(user.email, otp);
        return res.status(200).json({ message: "OTP sent to Email (SMS Failed)", userId: user._id, method: "email" });
      }
      user.otp = "TWILIO";
      await user.save();
      return res.status(200).json({ message: "OTP sent to Mobile", userId: user._id, method: "mobile" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Login failed" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;
  try {
    const user = await users.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp === "TWILIO") {
      const isTwilioValid = await verifyOtpSms(user.mobile, otp);
      if (!isTwilioValid) {
        return res.status(400).json({ message: "Invalid OTP." });
      }
    } else {
      if (!user.otp) {
        return res.status(400).json({ message: "OTP already used." });
      }
      if (user.otpExpiry < new Date()) {
        return res.status(400).json({ message: "OTP has expired." });
      }
      if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP." });
      }
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET || "test", { expiresIn: "1h" });

    return res.status(200).json({ result: user, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Verification failed" });
  }
};

export const subscribeChannel = async (req, res) => {
  const { channelId } = req.params;
  const { userId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(channelId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (channelId === userId) {
    return res.status(400).json({ message: "You cannot subscribe to your own channel" });
  }

  try {
    const channel = await users.findById(channelId);
    const currentUser = await users.findById(userId);

    if (!currentUser) {
  return res.status(404).json({ message: "Logged in user not found. Please re-login." });
}
if (!channel) {
  return res.status(404).json({ message: "Channel not found in database." });
}

    const isSubscribed = currentUser.subscribedChannels.includes(channelId);

    if (isSubscribed) {
      // Unsubscribe
      const updatedUser = await users.findByIdAndUpdate(userId, {
        $pull: { subscribedChannels: channelId }
      }, { new: true });
      await users.findByIdAndUpdate(channelId, {
        $pull: { subscribers: userId }
      });
      return res.status(200).json({ message: "Unsubscribed successfully", subscribed: false, user: updatedUser });
    } else {
      // Subscribe
      const updatedUser = await users.findByIdAndUpdate(userId, {
        $addToSet: { subscribedChannels: channelId }
      }, { new: true });
      await users.findByIdAndUpdate(channelId, {
        $addToSet: { subscribers: userId }
      });
      return res.status(200).json({ message: "Subscribed successfully", subscribed: true, user: updatedUser });
    }
  } catch (error) {
    console.error("Subscription error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

