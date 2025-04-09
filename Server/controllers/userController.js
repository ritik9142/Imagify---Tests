import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";
import crypto from "crypto";
import { sendVerificationEmail, generateVerificationCode } from "../services/emailService.js";

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

// Check for critical environment variables
if (!process.env.JWT_SECRET || !process.env.FRONTEND_URL) {
  console.error("Missing critical environment variables");
  process.exit(1);
}

/*
  Registration endpoint now handles both initial registration (sending OTP code)
  and OTP verification (when "code" is provided).
*/
const registerUser = async (req, res) => {
  try {
    const { name, email, password, code } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    const existingUser = await userModel.findOne({ email });

    if (!existingUser) {
      // New user registration
      if (!name || !password) {
        return res.json({ success: false, message: "Name and password are required for registration" });
      }

      const domain = email.split('@')[1];
      if (!trustedDomains.includes(domain)) {
        return res.json({ success: false, message: "Email domain not allowed" });
      }

      if (!validatePassword(password, name)) {
        return res.json({
          success: false,
          message: "Password must be at least 6 characters and include uppercase and lowercase letters, numbers, and symbols, and must not contain your name"
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const verificationCode = generateVerificationCode();
      const verificationCodeExpires = new Date().getTime() + 3600000; // 1 hour in UTC

      const userData = {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        verificationCode,
        verificationCodeExpires
      };

      const newUser = new userModel(userData);
      await newUser.save();

      await sendVerificationEmail(email, verificationCode);

      console.log(`New user registered: ${email}, Verification Code: ${verificationCode}, Expires: ${verificationCodeExpires}`);

      return res.json({
        success: true,
        message: "Verification code sent. Please enter the code to verify your account."
      });
    } else if (!existingUser.isVerified) {
      // Verification step
      if (!code || !password) {
        return res.json({ success: false, message: "Please provide the verification code and password" });
      }

      console.log(`Verification attempt for ${email}: Provided Code: "${code}", Stored Code: "${existingUser.verificationCode}", Expires: ${existingUser.verificationCodeExpires}, Current Time: ${Date.now()}`);

      const isCodeMatch = String(code) === String(existingUser.verificationCode);
      const isTimeValid = existingUser.verificationCodeExpires > Date.now();
      const isPasswordMatch = await bcrypt.compare(password, existingUser.password);

      console.log(`Verification details for ${email}: Code Match: ${isCodeMatch}, Time Valid: ${isTimeValid}, Password Match: ${isPasswordMatch}`);

      if (isCodeMatch && isTimeValid && isPasswordMatch) {
        existingUser.isVerified = true;
        existingUser.verificationCode = undefined;
        existingUser.verificationCodeExpires = undefined;
        await existingUser.save();

        const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log(`User ${email} verified and logged in successfully`);
        return res.json({
          success: true,
          token,
          user: { id: existingUser._id, name: existingUser.name },
          message: "Account verified and logged in."
        });
      } else {
        let errorMessage = "Verification failed: ";
        if (!isCodeMatch) errorMessage += "Wrong Verification Code. ";
        if (!isTimeValid) errorMessage += "Code has expired. ";
        if (!isPasswordMatch) errorMessage += "Wrong Password.";
        return res.status(404).json({ success: false, message: errorMessage.trim() });
      }
    } else {
      return res.json({
        success: false,
        message: "The email address you have entered is already registered and verified. Please log in."
      });
    }
  } catch (error) {
    console.error(`Error in registerUser for ${email}: ${error.message}`);
    return res.json({ success: false, message: error.message });
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
    return res.json({ success: false, message: error.message });
  }
};

/*
  Optional: An endpoint to verify email via a GET request using query parameters.
  This is provided if you want to support a link-based verification fallback.
*/
const verifyEmail = async (req, res) => {
  try {
    const { code, email } = req.query;
    const user = await userModel.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.json({ success: false, message: "Invalid or expired verification code" });
    }
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
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
    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date().getTime() + 3600000; // 1 hour in UTC
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();
    await sendVerificationEmail(email, verificationCode);
    return res.json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

// --- The remaining functions remain unchanged ---

const userCredits = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    return res.json({
      success: true,
      credits: user.creditBalance,
      user: { name: user.name }
    });
  } catch (error) {
    console.error(error.message);
    return res.json({ success: false, message: error.message });
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
    return res.json({ success: true, order });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
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
    return res.json({ success: true, message: "Credits Added" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
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
