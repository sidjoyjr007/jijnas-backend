import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";

import routes from "./src/routes/index.mjs";
import mongoConnectionUtils from "./src/utils/mongo-connection.utils.mjs";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cookieParser());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    credentials: true,
    origin: "https://quiznex.com"
  })
);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", "https://quiznex.com");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    return res.sendStatus(200);
  }
  next();
});

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
