import nodemailer from "nodemailer";
import { config } from "dotenv";

config();

const userMail = process.env.USER_MAIL;
const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userMail,
    pass: process.env.USER_PASS
  }
});

export const sendEmailVerificationCode = async (email, code) => {
  const mailOptions = {
    from: userMail,
    subject: "One Time Password - OTP",
    html: `<h3>your verification code is:</h3><br/ ><h1>${code}</h1>`,
    to: email
  };

  try {
    await transport.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};

export const userQuery = async (email) => {
  const mailOptions = {
    from: userMail,
    subject: "User Query",
    html: `<h3>User query email:</h3><br/ ><h1>${email}</h1>`,
    text: "Hello World",
    to: userMail
  };

  try {
    const res = await transport.sendMail(mailOptions);
    if (res) return true;
  } catch (err) {
    return false;
  }
};

export const sendTemporaryPassword = async (email, pwd) => {
  const mailOptions = {
    from: userMail,
    subject: "Node Mailer",
    text: `Your temproary password is ${pwd}`,
    to: email
  };

  try {
    await transport.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};
