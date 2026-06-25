import express from "express";
import { getPlans, createOrder, verifyPayment, getUserInvoices } from "../controllers/subscription.js";

const router = express.Router();

router.get("/plans", getPlans);
router.post("/payment/create", createOrder);
router.post("/payment/verify", verifyPayment);
router.get("/invoices/:userId", getUserInvoices);

export default router;
