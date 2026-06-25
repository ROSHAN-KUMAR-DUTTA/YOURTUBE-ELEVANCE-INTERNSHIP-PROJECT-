import users from "../Modals/Auth.js";

const southStates = ["Tamil Nadu", "Kerala", "Karnataka", "Andhra Pradesh", "Telangana"];

export const getTheme = async (req, res) => {
  const { id } = req.params;
  const { simulatedHour, simulatedState } = req.query;
  try {
    const user = await users.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let hours;
    if (simulatedHour !== undefined) {
      hours = parseInt(simulatedHour, 10);
    } else {
      const now = new Date();
      // Strictly fetch the hour in Asia/Kolkata timezone regardless of server location
      const options = { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' };
      hours = parseInt(new Intl.DateTimeFormat('en-US', options).format(now), 10);
    }

    const isTimeMatch = hours >= 10 && hours < 12;
    const currentState = simulatedState || user.state || "";
    const normalizedUserState = currentState.trim().toLowerCase();
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
