import express from "express";

import {
  signupHandler,
  loginHandler,
  logoutHandler,
  verifyEmail,
  updateVerifiedFlag,
  requestOTP,
  getUserDetails,
  forgotPasswordHandler
} from "../controllers/user.controller.mjs";
import deserializeUser from "../middlewares/deserializeUser.mjs";
import requireUser from "../middlewares/requireUser.mjs";

const userRouter = express.Router();

// Signup
userRouter.post("/signup", signupHandler);

// Login
userRouter.post("/login", loginHandler);

// Logout
userRouter.get("/logout", logoutHandler);

// Verify email
userRouter.post("/verify-email", verifyEmail);

// Update email verified flag
userRouter.post("/updateverify", updateVerifiedFlag);

// Forgot password
userRouter.post("/forgot-password", forgotPasswordHandler);

// Get user details
userRouter.get("/user-details", [deserializeUser, requireUser], getUserDetails);

// Request OTP
userRouter.post("/request-otp", requestOTP);

export default userRouter;
