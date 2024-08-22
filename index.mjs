import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import routes from "./src/routes/index.mjs";
import mongoConnectionUtils from "./src/utils/mongo-connection.utils.mjs";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cookieParser());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    credentials: true,
    // origin: "https://jijnas-frontend-nvwmghbpda-el.a.run.app",
    origin: "https://quiznex.com",
    AccessControlAllowOrigin: "*"
  })
);

const mongoConnection = async () => {
  const db = await mongoConnectionUtils.connectToDB();
  if (db) {
    routes(app);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
};

mongoConnection();
