import express from "express";
import { 
  registerUser, 
  loginUser, 
  userCredits, 
  paymentRazorpay, 
  verifyRazorpay,
  verifyEmail,
  resendVerificationEmail 
} from "../controllers/userController.js";
import userAuth from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.get("/credits", userAuth, userCredits);
userRouter.post("/pay-razor", userAuth, paymentRazorpay);
userRouter.post("/verify-razor", verifyRazorpay);
userRouter.get("/verify-email", verifyEmail);
userRouter.post("/resend-verification", resendVerificationEmail);

export default userRouter;

// For Postman:
// http://localhost:4000/api/user/register
// http://localhost:4000/api/user/login
