import mongoose from "mongoose";

const invoiceSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  planName: { type: String, required: true },
  amount: { type: Number, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  paymentId: { type: String, required: true },
  orderId: { type: String, required: true },
  paymentDate: { type: Date, default: Date.now },
  emailSent: { type: Boolean, default: false },
  transactionStatus: { type: String, default: "Success" }
});

export default mongoose.model("Invoice", invoiceSchema);
