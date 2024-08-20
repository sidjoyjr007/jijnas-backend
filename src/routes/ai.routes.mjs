import express from "express";

import {
  generateAIQuestions,
  uploadFile,
  listFiles
  // generateAIQuestionsFromFile
} from "../controllers/ai.controller.mjs";
import deserializeUser from "../middlewares/deserializeUser.mjs";
import requireUser from "../middlewares/requireUser.mjs";
const aiRouter = express.Router();

// Generate quiz data
aiRouter.post(
  "/generate-quiz",
  [deserializeUser, requireUser],
  generateAIQuestions
);

// Upload file
aiRouter.post("/upload-file", uploadFile);

// List files
aiRouter.get("/list-files", listFiles);

// // File quiz generation
// aiRouter.get("/file-quiz", generateAIQuestionsFromFile);

export default aiRouter;
