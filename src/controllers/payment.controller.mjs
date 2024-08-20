import { config } from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import { v4 as uuidV4 } from "uuid";

import mongoConnectionUtils from "../utils/mongo-connection.utils.mjs";
import strings from "../constants/strings.mjs";
import { getTokenCount } from "./quiz.controller.mjs";

const { internalServerErr } = strings;

config();

const razorPay = new Razorpay({
  key_id: process.env.CLIENT_ID,
  key_secret: process.env.CLIENT_SECRET
});

export const createOrder = async (req, res) => {
  const { currency, amount } = req.body;
  const options = {
    amount,
    currency,
    receipt: uuidV4
  };

  try {
    const response = await razorPay.orders.create(options);
    res.status(200).json({
      message: "Created order successfuly",
      order: {
        order_id: response.id,
        currency: response.currency,
        amount: response.amount
      }
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Not able to create order, please try again later" });
  }
};

const addTokensToUser = async (params) => {
  const { userId, tokens } = params;

  let retryCount = 5;
  try {
    const db = await mongoConnectionUtils.getDB();
    const userDetails = await getTokenCount(userId);
    console.log(userDetails);
    if (!userDetails?.tokens && userDetails?.tokens !== 0) {
      return false;
    }
    const newTokenCount = userDetails?.tokens + tokens;
    const tokensUpdated = await db
      ?.collection("users")
      .updateOne({ userId }, { $set: { tokens: newTokenCount } });
    console.log(tokensUpdated);

    if (tokensUpdated) return true;
    return false;
  } catch (err) {
    console.log(err);
    if (retryCount === 0) return false;
    addTokensToUser(params);
  }
};

const addPaymentDetails = async (params) => {
  try {
    const db = await mongoConnectionUtils.getDB();
    db?.collection("payments").insertOne(params);
  } catch (err) {
    console.log(err);
  }
};

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    tokens
  } = req.body;
  const secretKey = process.env.CLIENT_SECRET;

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    addPaymentDetails(req.body);
    const response = await addTokensToUser({ userId, tokens });
    console.log(response);
    if (response) {
      res.status(200).json({ message: "Payment completed successfully" });
    } else {
      res.status(207).json({
        message:
          "Payment completed successfully, but we are unable credit tokens to you, please contact support"
      });
    }
  } else {
    res.status(500).json({
      message:
        "Payment failed, if amount deducted from your bank account will be reverted"
    });
  }
};
