import User from "../Modals/Auth.js";
import Video from "../Modals/video.js";
import Download from "../Modals/downloadModel.js";

export const downloadVideo = async (req, res) => {
  const { videoId } = req.params;
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    if (!user.isPremium) {
      if (user.lastDownloadDate === today) {
        if (user.downloadsToday >= 1) {
          return res.status(403).json({ 
            message: "Daily download limit reached. Upgrade to Premium for unlimited downloads." 
          });
        }
      } else {
        // New day, reset counter
        user.downloadsToday = 0;
        user.lastDownloadDate = today;
      }

      user.downloadsToday += 1;
      await user.save();
    }

    const fileUrl = video.filepath;

    // Check if already downloaded
    const existingDownload = await Download.findOne({ userId, videoId });
    if (!existingDownload) {
      const newDownload = new Download({
        userId,
        videoId,
        title: video.videotitle,
        thumbnail: video.filepath 
  ? video.filepath
      .replace('/upload/', '/upload/w_400,h_225,c_fill,so_0/')
      .replace(/\.(mp4|mov|avi|mkv|webm)$/i, '.jpg') 
  : "",
        fileUrl,
        duration: "00:00" // You could pass actual duration if available
      });
      await newDownload.save();

      if (!user.downloads.includes(newDownload._id)) {
        user.downloads.push(newDownload._id);
        await user.save();
      }
    }

    return res.status(200).json({ url: fileUrl });
  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getUserDownloads = async (req, res) => {
  const { userId } = req.params;
  try {
    const downloads = await Download.find({ userId }).sort({ downloadedAt: -1 });
    res.status(200).json(downloads);
  } catch (error) {
    console.log("Get Downloads Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteDownload = async (req, res) => {
  const { id } = req.params;
  try {
    await Download.findByIdAndDelete(id);
    res.status(200).json({ message: "Download deleted successfully" });
  } catch (error) {
    console.log("Delete Download Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
