import jwt from "jsonwebtoken";
import { config } from "dotenv";

config();

// sign jwt
export function signJWT(payload, expiresIn) {
  const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");
  return jwt.sign(payload, privateKey, { algorithm: "RS256", expiresIn });
}

// verify jwt
export function verifyJWT(token) {
  const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, "\n");
  try {
    const decoded = jwt.verify(token, publicKey);
    return { payload: decoded, expired: false };
  } catch (error) {
    return {
      payload: null,
      expired: error.message.includes("jwt expired")
    };
  }
}
