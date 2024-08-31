import { v4 as uuidV4 } from "uuid";
import { getAllInfoByISO } from "iso-country-currency";

import { hashfunction, generateRandomNumber } from "../utils/common.utils.mjs";
import stringConst from "../constants/strings.mjs";
import mongoConnectionUtils from "../utils/mongo-connection.utils.mjs";
import { signJWT } from "../utils/jwt.utils.mjs";
import { sendEmailVerificationCode } from "../utils/mail.utils.mjs";
import { compareHash } from "../utils/common.utils.mjs";
import { getProductPrice, getRate } from "./utils.controller.mjs";

const {
  internalServerErr,
  emailExists,
  signupSuccess,
  userNotFound,
  loggedInSuccess,
  loggedOutSuccess,
  badRequest,
  unAuthorized
} = stringConst;

const addUser = async (db, name, email, password, verified, rest) => {
  try {
    const result = await db
      ?.collection("users")
      .insertOne({ email, name, password, verified, ...rest });
    return true;
  } catch (err) {
    return false;
  }
};

export const signupHandler = async (req, res) => {
  const { email, name, password, countryCode, ...rest } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ message: badRequest });
  }

  const userId = uuidV4();

  // Check user exists or not
  try {
    const db = await mongoConnectionUtils.getDB();
    const user = await db?.collection("users").findOne({ email });
    if (user) {
      return res.status(409).json({ message: emailExists });
    }

    // Generate password hash
    const hash = await hashfunction(password);

    if (!hash) {
      return res.status(500).json({ message: internalServerErr });
    }

    if (countryCode) {
      const moreInfo = getAllInfoByISO(countryCode);
      rest.moreInfo = moreInfo;
    }

    rest.userId = userId;
    rest.tokens = 60;

    // Insert user to the DB
    const isUserAdded = await addUser(db, name, email, hash, false, rest);

    if (isUserAdded) {
      const accessToken = signJWT({ email, name, userId }, "30m");
      const refreshToken = signJWT({ email, name, userId }, "1y");

      const sessionData = { accessToken, refreshToken };

      res.cookie("__session", JSON.stringify(sessionData), {
        maxAge: 1800000,
        domain: ".quiznex.com",
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "None"
      });

      // res.cookie("refreshToken", refreshToken, {
      //   maxAge: 3.154e10, // 1 year
      //   domain: ".quiznex.com",
      //   path: "/",
      //   secure: true,
      //   httpOnly: true,
      //   sameSite: "None"
      // });

      const rate = await getRate(rest?.moreInfo?.currency);
      const price = await getProductPrice();

      const userDetails = {
        userName: name,
        userEmail: email,
        userId,
        tokens: 100,
        moreInfo: rest?.moreInfo,
        verified: false,
        rate,
        price
      };
      return res.status(200).json({ userDetails, message: signupSuccess });
    }

    return res.status(500).json({ message: internalServerErr });
  } catch (err) {
    res.status(500).json({ message: internalServerErr });
  }
};

export const loginHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: badRequest });
  }

  // Verify the user exist or not from DB
  try {
    const db = await mongoConnectionUtils.getDB();
    const user = await db?.collection("users").findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: userNotFound
      });
    }
    // Compare the password
    const result = compareHash(password.toString(), user.password);
    if (!result) {
      return res.status(404).json({
        message: userNotFound
      });
    } else if (result === "error") {
      return res.status(500).json({ message: internalServerErr });
    }

    const accessToken = signJWT(
      { email, name: user?.name, userId: user?.userId },
      "30m"
    );

    const refreshToken = signJWT(
      { email, name: user?.name, userId: user?.userId },
      "1y"
    );
    const sessionData = { accessToken, refreshToken };

    res.cookie("__session", JSON.stringify(sessionData), {
      maxAge: 1800000,
      domain: ".quiznex.com",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "None"
    });

    // res.cookie("refreshToken", refreshToken, {
    //   maxAge: 3.154e10, // 1 year
    //   domain: ".quiznex.com",
    //   path: "/",
    //   secure: true,
    //   httpOnly: true,
    //   sameSite: "None"
    // });

    const rate = await getRate(user?.moreInfo?.currency);
    const price = await getProductPrice();

    const userDetails = {
      userName: user?.name,
      userEmail: user?.email,
      userId: user?.userId,
      tokens: user?.tokens,
      moreInfo: user?.moreInfo,
      verified: user?.verified,
      rate,
      price
    };
    res.status(200).json({
      userDetails,
      message: loggedInSuccess
    });
  } catch (err) {
    err;
    res.status(500).json({ message: internalServerErr });
  }
};

export const logoutHandler = (req, res) => {
  const sessionData = { accessToken: "", refreshToken: "" };

  res.cookie("__session", JSON.stringify(sessionData), {
    maxAge: 0,
    domain: ".quiznex.com",
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "None"
  });

  // res.cookie("refreshToken", "", {
  //   maxAge: 0, // 1 year
  //   domain: ".quiznex.com",
  //   path: "/",
  //   secure: true,
  //   httpOnly: true,
  //   sameSite: "None"
  // });

  return res.status(200).send({ message: loggedOutSuccess });
};

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: badRequest });
  }

  try {
    const db = await mongoConnectionUtils.getDB();
    const user = await db?.collection("users").findOne({ email });
    if (user) {
      if (user?.verificationCode === otp) {
        const isUpdated = await updateVerifiedFlag(user?.userId);
        if (isUpdated) {
          return res.status(200).json({
            message: "Verified email successfully"
          });
        }
        return res.status(500).json({
          message: "Unable to verify OTP"
        });
      } else {
        return res.status(400).json({
          message: "Invalid OTP"
        });
      }
    }
    return res.status(404).json({
      message: "User doesn't exist in our record."
    });
  } catch (err) {
    res.status(500).json({ message: internalServerErr });
  }
};

export const updateVerifiedFlag = async (userId) => {
  const db = await mongoConnectionUtils.getDB();
  try {
    const updated = await db
      .collection("users")
      .updateOne({ userId }, { $set: { verified: true } });
    if (updated) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
};

export const changePassword = async (email, password) => {
  const db = await mongoConnectionUtils.getDB();

  // Generate password hash
  const hash = await hashfunction(password);

  if (!hash) {
    res.status(500).json({ message: internalServerErr });
  }

  try {
    const result = await db
      .collection("users")
      .updateOne({ email }, { $set: { password: hash } });
    return result;
  } catch (err) {
    return false;
  }
};

export const requestOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: badRequest });
  }
  const verificationCode = generateRandomNumber(6);

  try {
    const db = await mongoConnectionUtils.getDB();
    const user = await db?.collection("users").findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email does not exists" });
    }

    const isVerificationCodeUpdated = await db
      .collection("users")
      .updateOne({ email }, { $set: { verificationCode } });

    if (isVerificationCodeUpdated) {
      sendEmailVerificationCode(email, verificationCode);
      return res.status(200).json({ message: "OTP sent successfully" });
    }

    return res.status(500).json({ message: internalServerErr });
  } catch (err) {
    return res.status(500).json({ message: internalServerErr });
  }
};

export const getUserDetails = async (req, res) => {
  const email = req.user.email;
  const db = await mongoConnectionUtils.getDB();
  try {
    const user = await db?.collection("users").findOne({ email });
    const price = await getProductPrice();

    if (user) {
      const rate = await getRate(user?.moreInfo?.currency);
      const userDetails = {
        userName: user?.name,
        userEmail: user?.email,
        userId: user?.userId,
        moreInfo: user?.moreInfo,
        verified: user?.verified,
        tokens: user?.tokens,
        rate,
        price
      };
      return res.status(200).json({ userDetails, message: "OK" });
    }

    const sessionData = { accessToken: "", refreshToken: "" };

    res.cookie("__session", JSON.stringify(sessionData), {
      maxAge: 0,
      domain: ".quiznex.com",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "None"
    });

    // res.cookie("refreshToken", "", {
    //   maxAge: 0,
    //   domain: ".quiznex.com",
    //   path: "/",
    //   secure: true,
    //   httpOnly: true,
    //   sameSite: "None"
    // });

    return res.status(401).json({ message: unAuthorized });
  } catch (err) {
    return res.status(500).json({ message: internalServerErr });
  }
};

export const forgotPasswordHandler = async (req, res) => {
  const { email, pwd } = req.body;

  if (!email || !pwd) {
    return res.status(400).json({ message: badRequest });
  }
  try {
    const db = await mongoConnectionUtils.getDB();

    const result = await db?.collection("users").findOne({ email });
    if (result) {
      const isPasswordChanged = await changePassword(email, pwd);
      if (isPasswordChanged) {
        return res
          .status(200)
          .json({ message: "Password has been changed successfully" });
      }
    }
    res.status(500).json({
      message: "Unable to change password please try again."
    });
  } catch (err) {
    res.status(500).json({ message: internalServerErr });
  }
};
