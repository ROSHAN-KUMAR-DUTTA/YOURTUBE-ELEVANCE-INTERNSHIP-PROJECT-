import Razorpay from "razorpay";
import crypto from "crypto";
import User from "../Modals/Auth.js";
import Invoice from "../Modals/Invoice.js";
import { sendInvoiceEmail } from "../utils/emailService.js";

const PLANS = {
  Free: {
    price: 0,
    watchLimit: 300,
    label: "Free",
    description: "Max video watch time: 5 minutes",
  },
  Bronze: {
    price: 10,
    watchLimit: 420,
    label: "Bronze",
    description: "Max video watch time: 7 minutes",
  },
  Silver: {
    price: 50,
    watchLimit: 600,
    label: "Silver",
    description: "Max video watch time: 10 minutes",
  },
  Gold: {
    price: 100,
    watchLimit: -1,
    label: "Gold",
    description: "Unlimited watch time",
  },
};

export const getPlans = (req, res) => {
  return res.status(200).json(PLANS);
};

export const createOrder = async (req, res) => {
  const { planName } = req.body;

  try {
    const plan = PLANS[planName];

    if (!plan || plan.price === 0) {
      return res.status(400).json({
        message: "Invalid plan for payment",
      });
    }

    const keyId = process.env.RAZORPAY_KEY_ID?.trim() || "dummy";
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "dummy";

    // Mock Mode
    if (keyId === "dummy" || keySecret === "dummy") {
      return res.json({
        id: "order_mock_" + Date.now(),
        amount: plan.price * 100,
        currency: "INR",
        planName,
      });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount: plan.price * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return res.json({
      ...order,
      planName,
    });

  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      message: "Failed to create Razorpay order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    planName,
  } = req.body;

  try {
    const plan = PLANS[planName];

    if (!plan) {
      return res.status(400).json({
        message: "Invalid Plan",
      });
    }

    let verified = false;

    // Mock Mode
    if (razorpay_order_id.startsWith("order_mock_")) {
      verified = true;
    } else {
      const secret = process.env.RAZORPAY_KEY_SECRET;

      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      verified = generatedSignature === razorpay_signature;
    }

    if (!verified) {
      return res.status(400).json({
        message: "Payment verification failed",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const startDate = new Date();

    const endDate = new Date();

    endDate.setMonth(endDate.getMonth() + 1);

    const invoice = new Invoice({
      userId: user._id,
      invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      planName: plan.label,
      amount: plan.price,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      paymentDate: startDate,
    });

    user.currentPlan = plan.label;
    user.watchLimit = plan.watchLimit;
    user.isPremium = true;
    user.subscriptionStartDate = startDate;
    user.subscriptionEndDate = endDate;
    user.premiumSince = startDate;
    user.invoices.push(invoice._id);

    await Promise.all([
      invoice.save(),
      user.save(),
    ]);

    // ---------- SEND RESPONSE IMMEDIATELY ----------
    res.status(200).json({
      success: true,
      isPremium: true,
      currentPlan: user.currentPlan,
      watchLimit: user.watchLimit,
      subscriptionEndDate: user.subscriptionEndDate,
    });

    // ---------- Background Email ----------
    sendInvoiceEmail(user, invoice)
      .then(async (emailSent) => {
        if (emailSent) {
          invoice.emailSent = true;
          await invoice.save();
        }
      })
      .catch((err) => {
        console.error("Invoice Email Error:", err);
      });

  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      message: "Server Error during verification",
    });
  }
};

export const getUserInvoices = async (req, res) => {
  const { userId } = req.params;

  try {
    const invoices = await Invoice.find({
      userId,
    }).sort({
      paymentDate: -1,
    });

    return res.status(200).json(invoices);

  } catch (error) {
    console.error("Invoice Fetch Error:", error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};