import { signJWT, verifyJWT } from "../utils/jwt.utils.mjs";

function deserializeUser(req, res, next) {
  const sessionCookie = req.cookies["__session"];
  let accessToken;
  let refreshToken;
  if (sessionCookie) {
    const sessionData = JSON.parse(sessionCookie);
    accessToken = sessionData?.accessToken || "";
    refreshToken = sessionData?.refreshToken || "";
  } else {
    return next();
  }
  if (!accessToken) {
    return next();
  }

  const { payload, expired } = verifyJWT(accessToken);

  // For a valid access token
  if (payload) {
    req.user = payload;
    return next();
  }

  // expired but valid access token

  const { payload: refresh } =
    expired && refreshToken ? verifyJWT(refreshToken) : { payload: null };

  if (!refresh) {
    return next();
  }

  const { iat, exp, ...rest } = refresh;
  const newAccessToken = signJWT(rest, "30m");

  res.cookie("accessToken", newAccessToken, {
    maxAge: 1800000,
    domain: ".quiznex.com",
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "None"
  });

  req.user = rest;

  return next();
}

export default deserializeUser;
