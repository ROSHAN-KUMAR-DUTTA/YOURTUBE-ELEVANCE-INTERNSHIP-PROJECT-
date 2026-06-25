import Call from "../Modals/Call.js";

export const saveCallHistory = async (req, res) => {
  try {
    const { callerId, receiverId, startedAt, endedAt, recordingName } = req.body;
    
    if (!callerId || !receiverId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newCall = new Call({
      callerId,
      receiverId,
      startedAt,
      endedAt,
      recordingName
    });

    await newCall.save();
    res.status(201).json({ message: "Call history saved successfully", data: newCall });
  } catch (error) {
    console.error("Error saving call history:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getCallHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    const calls = await Call.find({
      $or: [{ callerId: userId }, { receiverId: userId }],
    })
      .populate("callerId", "name email")
      .populate("receiverId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ data: calls });
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
