import video from "../Modals/video.js";

export const uploadvideo = async (req, res) => {
  if (req.file === undefined) {
    return res
      .status(400)
      .json({ message: "Please upload an mp4 or webm video file only" });
  } else {
    try {
      const file = new video({
        videotitle: req.body.videotitle,
        filename: req.file.originalname,
        filepath: req.file.path,
        filetype: req.file.mimetype,
        filesize: req.file.size,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getvideobyid = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await video.findById(id);
    if (!file) {
      return res.status(404).json({ message: "Video not found" });
    }
    return res.status(200).send(file);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
