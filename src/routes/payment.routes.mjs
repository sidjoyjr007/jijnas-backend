import express from "express";

import {
  createOrder,
  verifyPayment
} from "../controllers/payment.controller.mjs";
import deserializeUser from "../middlewares/deserializeUser.mjs";
import requireUser from "../middlewares/requireUser.mjs";
const paymentRouter = express.Router();

// Create payment order
paymentRouter.post(
  "/create-order",
  [deserializeUser, requireUser],
  createOrder
);

// Verify payment
paymentRouter.post(
  "/verify-payment",
  [deserializeUser, requireUser],
  verifyPayment
);

export default paymentRouter;
