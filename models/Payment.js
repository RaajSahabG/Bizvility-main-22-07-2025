import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model
    required: true,
  },
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true },
  signature: { type: String, required: true },

  amount: { type: Number, required: true },
  tax: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
  },
  baseAmount: { type: Number, required: true }, // amount before tax

  isUP: { type: Boolean, required: true }, // true if in Uttar Pradesh

  status: {
    type: String,
    enum: ["success", "failed", "pending"],
    default: "pending",
  },

  billingDetails: {
    name: String,
    email: String,
    contact: String,
    state: String,
    address: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Payment", paymentSchema);
