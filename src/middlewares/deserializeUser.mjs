import { signJWT, verifyJWT } from "../utils/jwt.utils.mjs";

function deserializeUser(req, res, next) {
  const { accessToken, refreshToken } = req.cookies;

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
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });

  req.user = rest;

  return next();
}

export default deserializeUser;
