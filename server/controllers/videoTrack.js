import User from "../Modals/Auth.js";

export const trackWatchTime = async (req, res) => {
  const { userId, secondsWatched } = req.body;
  if (!userId || secondsWatched === undefined || secondsWatched === null) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Reset daily watch time if a new day
    if (user.lastWatchDate !== today) {
      user.watchTimeAccumulatedToday = 0;
      user.lastWatchDate = today;
    }

    // Gold / unlimited watch limit is represented by -1
    if (user.watchLimit === -1) {
      await user.save();
      return res.status(200).json({ limitReached: false, remainingSeconds: "unlimited" });
    }

    user.watchTimeAccumulatedToday += secondsWatched;
    await user.save();

    const remainingSeconds = user.watchLimit - user.watchTimeAccumulatedToday;
    
    if (user.watchTimeAccumulatedToday >= user.watchLimit) {
      return res.status(200).json({ limitReached: true, remainingSeconds: 0 });
    }

    return res.status(200).json({ limitReached: false, remainingSeconds });
  } catch (error) {
    console.error("Track Time Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
