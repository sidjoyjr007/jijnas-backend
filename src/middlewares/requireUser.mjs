import strings from "../constants/strings.mjs";

const { unAuthorized } = strings;

const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).send({ message: unAuthorized });
  }

  return next();
};

export default requireUser;
