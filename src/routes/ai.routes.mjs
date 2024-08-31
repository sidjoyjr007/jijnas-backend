import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  generateAIQuestions,
  fileAssistant,
  regenerateInFile
} from "../controllers/ai.controller.mjs";
import deserializeUser from "../middlewares/deserializeUser.mjs";
import requireUser from "../middlewares/requireUser.mjs";

const aiRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);

// Get the directory name of the current file
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "../controllers/uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: storage });
// const upload = multer({ dest: uploadDir });

// Generate quiz data
aiRouter.post(
  "/generate-quiz",
  [deserializeUser, requireUser],
  generateAIQuestions
);

aiRouter.post("/file-assistant", upload.single("file"), fileAssistant);
aiRouter.post(
  "/regenerate-in-file",
  [deserializeUser, requireUser],
  regenerateInFile
);

export default aiRouter;
