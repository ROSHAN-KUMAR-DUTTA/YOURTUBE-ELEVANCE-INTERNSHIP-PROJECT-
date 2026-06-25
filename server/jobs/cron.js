import cron from "node-cron";
import User from "../Modals/Auth.js";

// Run every night at midnight
export const startCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("Running midnight cron job for subscription expiry check...");
    try {
      const now = new Date();
      
      // Find users whose subscriptionEndDate is in the past and are currently premium
      const expiredUsers = await User.find({
        isPremium: true,
        subscriptionEndDate: { $lt: now }
      });

      for (let user of expiredUsers) {
        user.isPremium = false;
        user.currentPlan = "Free";
        user.watchLimit = 300; // Reset to 5 mins
        await user.save();
        console.log(`Downgraded user ${user.email} to Free plan due to expiry.`);
      }
      
      console.log(`Cron completed. Downgraded ${expiredUsers.length} users.`);
    } catch (error) {
      console.error("Cron Job Error:", error);
    }
  });
  console.log("Cron jobs initialized.");
};
