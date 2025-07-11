import dotenv from "dotenv";
dotenv.config(); // ✅ ensure .env is loaded here

import Razorpay from "razorpay";

// console.log("🔐 RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
// console.log("🔐 RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default razorpay;
