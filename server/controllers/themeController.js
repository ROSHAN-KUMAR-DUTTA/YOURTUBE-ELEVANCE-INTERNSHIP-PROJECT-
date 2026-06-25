import users from "../Modals/Auth.js";

const southStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];

export const getTheme = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await users.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const now = new Date();
    // Convert current UTC time to IST by adding 5.5 hours
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    const hours = istTime.getUTCHours(); 

    // Between 10:00 AM and 12:00 PM (10 and 11)
    const isTimeMatch = hours >= 10 && hours < 12;
    const normalizedUserState = user.state ? user.state.trim().toLowerCase() : "";
    const isStateMatch = southStates.map(s => s.toLowerCase()).includes(normalizedUserState);

    if (isTimeMatch && isStateMatch) {
      return res.status(200).json({ theme: "light" });
    } else {
      return res.status(200).json({ theme: "dark" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Theme error", theme: "dark" });
  }
};
