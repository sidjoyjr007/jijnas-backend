import userRouter from "./user.routes.mjs";
import quizRouter from "./quiz.routes.mjs";
import aiRouter from "./ai.routes.mjs";
import paymentRouter from "./payment.routes.mjs";
import { userQuery } from "../utils/mail.utils.mjs";

import strings from "../constants/strings.mjs";
const { badRequest } = strings;

const routes = (app) => {
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/quiz", quizRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/payment", paymentRouter);

  app.post("/api/v1/contact", async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: badRequest });
    }
    try {
      await userQuery(email);
      return res
        .status(200)
        .json({ message: "We got your request, will get back to you soon" });
    } catch (err) {
      return res
        .status(500)
        .json({ message: "Oh, something went wrong, please try agian later" });
    }
  });
};

export default routes;
