import express from "express";

import {
  saveQuiz,
  getMyQuizzes,
  getMyQuiz,
  createQuizEvent,
  getMyEvents,
  // startEvent,
  deleteMyQuiz,
  getMyEventDetails,
  registerUserForEvent,
  submitAnswer,
  finishQuiz,
  getEventResult
} from "../controllers/quiz.controller.mjs";
import deserializeUser from "../middlewares/deserializeUser.mjs";
import requireUser from "../middlewares/requireUser.mjs";
const quizRouter = express.Router();

// Save quiz data
quizRouter.post("/save", [deserializeUser, requireUser], saveQuiz);

// Fetch quiz list
quizRouter.get("/my-quizzes", [deserializeUser, requireUser], getMyQuizzes);

// Fetch quiz
quizRouter.get("/my-quiz", [deserializeUser, requireUser], getMyQuiz);

// Create quiz event
quizRouter.post(
  "/create-event",
  [deserializeUser, requireUser],
  createQuizEvent
);

// Fetch events
quizRouter.get("/my-events", [deserializeUser, requireUser], getMyEvents);

// Delete quiz
quizRouter.get("/delete-quiz", [deserializeUser, requireUser], deleteMyQuiz);

// Get event details
quizRouter.get("/event-details", getMyEventDetails);

// Register user for event
quizRouter.post("/register-user", registerUserForEvent);

// Submit answer
quizRouter.post("/submit-answer", submitAnswer);

// Finish quiz
quizRouter.get("/finish-quiz", finishQuiz);

// Get event result
quizRouter.get("/event-result", [deserializeUser, requireUser], getEventResult);

export default quizRouter;
