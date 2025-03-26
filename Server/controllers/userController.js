import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";
import crypto from "crypto";
import { sendVerificationEmail } from "../services/emailService.js";

// Trusted domains list
const trustedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.in'];

// Password validation function
const validatePassword = (password, name) => {
  if (password.length < 6) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  if (name && password.toLowerCase().includes(name.toLowerCase())) return false;
  return true;
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // Check email domain
    const domain = email.split('@')[1];
    if (!trustedDomains.includes(domain)) {
      return res.json({ success: false, message: "Email domain not allowed" });
    }

    // Check for duplicate email
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "The email address you have entered is already registered. Want to sign in instead?"
      });
    }

    // Validate password
    if (!validatePassword(password, name)) {
      return res.json({
        success: false,
        message: "Password must be at least 6 characters and include uppercase and lowercase letters, numbers, and symbols, and must not contain your name"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 3600000; // 1 hour

    const userData = {
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationTokenExpires
    };
    const newUser = new userModel(userData);
    await newUser.save();

    await sendVerificationEmail(email, verificationToken);

    res.json({ success: true, message: "Please check your email to verify your account" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    if (!user.isVerified) {
      return res.json({ success: false, message: "Please verify your email first" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    return res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name }
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await userModel.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.json({ success: false, message: "Invalid or expired verification link" });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    if (user.isVerified) {
      return res.json({ success: false, message: "Email already verified" });
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + 3600000; // 1 hour
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();
    await sendVerificationEmail(email, verificationToken);
    res.json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Existing functions (unchanged)
const userCredits = async (req, res) => {
  try {
    const { userID } = req.body;
    const user = await userModel.findById(userID);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name }
    });
  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const paymentRazorpay = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const token = req.headers.token;
    if (!token) {
      return res.json({ success: false, message: "Missing token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }
    let credits, plan, amount, date;
    switch (planId) {
      case "Basic":
        plan = "Basic";
        credits = 100;
        amount = 99;
        break;
      case "Advanced":
        plan = "Advanced";
        credits = 500;
        amount = 459;
        break;
      case "Business":
        plan = "Business";
        credits = 5000;
        amount = 4499;
        break;
      default:
        return res.json({ success: false, message: "Plan not found" });
    }
    date = Date.now();
    const transactionData = { userId, plan, amount, credits, date };
    const newTransaction = await transactionModel.create(transactionData);
    const options = {
      amount: amount * 100,
      currency: process.env.CURRENCY,
      receipt: newTransaction._id.toString()
    };
    const order = await razorpayInstance.orders.create(options);
    res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest("hex");
    if (generatedSignature !== razorpay_signature) {
      return res.json({ success: false, message: "Payment verification failed" });
    }
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    const transactionData = await transactionModel.findById(orderInfo.receipt);
    if (!transactionData) {
      return res.json({ success: false, message: "Transaction not found" });
    }
    if (transactionData.payment) {
      return res.json({ success: false, message: "Payment already processed" });
    }
    const userData = await userModel.findById(transactionData.userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found" });
    }
    const creditBalance = userData.creditBalance + transactionData.credits;
    await userModel.findByIdAndUpdate(userData._id, { creditBalance });
    await transactionModel.findByIdAndUpdate(transactionData._id, { payment: true });
    res.json({ success: true, message: "Credits Added" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  userCredits,
  paymentRazorpay,
  verifyRazorpay,
  verifyEmail,
  resendVerificationEmail
};