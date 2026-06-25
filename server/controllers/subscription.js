import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../Modals/Auth.js";
import Invoice from "../Modals/Invoice.js";
import { sendInvoiceEmail } from "../utils/emailService.js";

const PLANS = {
  Free: { price: 0, watchLimit: 300, label: "Free", description: "Max video watch time: 5 minutes" },
  Bronze: { price: 10, watchLimit: 420, label: "Bronze", description: "Max video watch time: 7 minutes" },
  Silver: { price: 50, watchLimit: 600, label: "Silver", description: "Max video watch time: 10 minutes" },
  Gold: { price: 100, watchLimit: -1, label: "Gold", description: "Unlimited watch time" },
};

export const getPlans = (req, res) => {
  res.status(200).json(PLANS);
};

export const createOrder = async (req, res) => {
  const { planName } = req.body;
  try {
    const plan = PLANS[planName];
    if (!plan || plan.price === 0) {
      return res.status(400).json({ message: "Invalid plan for payment" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "dummy";
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "dummy";

    if (keyId === "dummy" || !keyId) {
      return res.json({ id: "order_mock_" + Date.now(), amount: plan.price * 100, currency: "INR" });
    }

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const options = {
      amount: plan.price * 100, // in paise
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const order = await instance.orders.create(options);
    if (!order) throw new Error("Empty order returned");
    return res.json({ ...order, planName });
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

export const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planName } = req.body;

  try {
    const plan = PLANS[planName];
    if (!plan) return res.status(400).json({ message: "Invalid plan" });

    let isVerified = false;

    if (razorpay_order_id && razorpay_order_id.startsWith("order_mock_")) {
      isVerified = true;
    } else if (process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET !== "dummy") {
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        isVerified = true;
      }
    } else {
      isVerified = true;
    }

    if (!isVerified) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const invoiceNumber = "INV-" + Date.now() + Math.floor(Math.random() * 1000);
    
    const invoice = new Invoice({
      userId: user._id,
      planName: plan.label,
      amount: plan.price,
      invoiceNumber,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentDate: startDate,
    });

    await invoice.save();

    // Update user
    user.currentPlan = plan.label;
    user.watchLimit = plan.watchLimit;
    user.isPremium = true;
    user.subscriptionStartDate = startDate;
    user.subscriptionEndDate = endDate;
    user.invoices.push(invoice._id);
    await user.save();

    // Send Email
    const emailSent = await sendInvoiceEmail(user, invoice);
    if (emailSent) {
      invoice.emailSent = true;
      await invoice.save();
    }

    return res.status(200).json({ message: "Payment verified and plan updated successfully", isPremium: true, user });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({ message: "Server Error during verification" });
  }
};

export const getUserInvoices = async (req, res) => {
  const { userId } = req.params;
  try {
    const invoices = await Invoice.find({ userId }).sort({ paymentDate: -1 });
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Get Invoices Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
