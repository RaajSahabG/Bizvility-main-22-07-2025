import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";
import razorpay from "../utils/razorpayInstance.js";
import Payment from "../models/Payment.js";

// 🧮 GST Calculation
const calculateGST = (amount, state) => {
  const baseAmount = parseFloat((amount / 1.18).toFixed(2));
  const gstAmount = parseFloat((amount - baseAmount).toFixed(2));

  if (state.toLowerCase() === "uttar pradesh") {
    return {
      baseAmount,
      cgst: parseFloat((gstAmount / 2).toFixed(2)),
      sgst: parseFloat((gstAmount / 2).toFixed(2)),
      igst: 0,
      isUP: true,
    };
  } else {
    return {
      baseAmount,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      isUP: false,
    };
  }
};

// ✅ Step 1: Create Razorpay Order
export const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const options = {
    amount: amount * 100, // amount in paise
    currency: "INR",
    receipt: `rcpt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  res.status(200).json({
    success: true,
    order,
  });
});

// ✅ Step 2: Verify & Save Payment
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    billingDetails, // name, email, contact, state, address
    amount,
  } = req.body;

  // Signature verification
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (!isAuthentic) {
    return res.status(400).json({ success: false, message: "Invalid signature" });
  }

  const gstDetails = calculateGST(amount, billingDetails.state);

  const payment = new Payment({
    user: req.user._id,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    amount,
    baseAmount: gstDetails.baseAmount,
    tax: {
      cgst: gstDetails.cgst,
      sgst: gstDetails.sgst,
      igst: gstDetails.igst,
    },
    isUP: gstDetails.isUP,
    status: "success",
    billingDetails,
  });

  await payment.save();

  // ✅ Generate invoice
  const invoicePath = path.join("invoices", `invoice-${payment._id}.pdf`);
  await generateInvoicePDF(payment, invoicePath);

  res.status(201).json({
    success: true,
    message: "Payment verified and invoice generated",
    invoiceUrl: `/invoices/invoice-${payment._id}.pdf`, // if you serve statically
  });
});

// ✅ Step 3: Get Payment History (admin or user)
export const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate("user").sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    payments,
  });
});
