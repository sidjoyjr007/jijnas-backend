import mongoConnectionUtils from "../utils/mongo-connection.utils.mjs";
import stringConst from "../constants/strings.mjs";
import { client } from "../utils/mongo-connection.utils.mjs";
import { getProductPrice } from "./utils.controller.mjs";

const { internalServerErr, badRequest } = stringConst;

export const saveQuiz = async (req, res) => {
  const {
    quizId,
    quizName,
    lastUpdated,
    userId,
    totalQuestions,
    options,
    questionName,
    question,
    explaination,
    rightAnswers,
    slideId
  } = req.body;

  try {
    const session = client.startSession();
    session.startTransaction();
    const db = await mongoConnectionUtils.getDB();
    const quizCollection = db.collection("quiz");
    const slidesCollection = db.collection("quiz_slides");

    try {
      const quizQuery = { quizId };
      const quizUpdate = {
        $set: {
          quizName,
          slideId,
          lastUpdated,
          quizId,
          userId,
          totalQuestions
        }
      };
      const slideQuery = { slideId };
      const slideUpdate = {
        $set: {
          quizId,
          options,
          questionName,
          question,
          explaination,
          rightAnswers,
          slideId
        }
      };
      const dbOptions = { upsert: true };
      await quizCollection.updateOne(quizQuery, quizUpdate, dbOptions);
      await slidesCollection.updateOne(slideQuery, slideUpdate, dbOptions);

      await session.commitTransaction();
      return res
        .status(200)
        .json({ message: "Quiz saved successfully", slideId });
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ message: internalServerErr });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: internalServerErr });
  }
};

export const getMyQuizzes = async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: badRequest });
  }
  const db = await mongoConnectionUtils.getDB();
  try {
    const projection = {
      quizId: 1,
      lastUpdated: 1,
      quizName: 1,
      totalQuestions: 1
    };
    const result = await db
      .collection("quiz")
      .find({ userId: userId }, { projection })
      .sort({ lastUpdated: -1 })
      .toArray();
    if (result) {
      return res.status(200).json({ message: "Fetched successfully", result });
    }
    res.status(500).json({ message: internalServerErr });
  } catch (err) {
    res.status(500).json({ message: internalServerErr });
  }
};

export const getMyQuiz = async (req, res) => {
  const { quizId } = req.query;

  if (!quizId) {
    return res.status(400).json({ message: badRequest });
  }

  const db = await mongoConnectionUtils.getDB();
  try {
    const quizSlidesCollection = await db.collection("quiz_slides");
    const pipeline = [
      {
        $match: {
          quizId: quizId
        }
      },
      {
        $group: {
          _id: "$quizId",
          slides: {
            $push: "$$ROOT"
          }
        }
      },
      {
        $lookup: {
          from: "quiz",
          localField: "_id",
          foreignField: "quizId",
          as: "quiz_info"
        }
      },
      {
        $unwind: "$quiz_info"
      },
      {
        $project: {
          _id: 0,
          quizId: "$_id",
          quizName: "$quiz_info.quizName",
          slides: 1
        }
      }
    ];

    const cursor = await quizSlidesCollection.aggregate(pipeline);

    const results = await cursor.toArray();

    if (results) {
      return res.status(200).json({ message: "Fetched successfully", results });
    }
    res.status(500).json({ message: internalServerErr });
  } catch (err) {
    res.status(500).json({ message: internalServerErr });
  }
};

export const getTokenCount = async (userId) => {
  try {
    const db = await mongoConnectionUtils.getDB();
    const userDetails = await db.collection("users").find({ userId }).toArray();
    return userDetails?.[0];
  } catch (err) {
    return null;
  }
};

export const createQuizEvent = async (req, res) => {
  const {
    eventId,
    eventName,
    quizId,
    timing,
    additionalInfo = "",
    userId,
    startTime,
    createdAt
  } = req.body;
  if (
    !userId ||
    !eventId ||
    !startTime ||
    !timing ||
    !eventName ||
    !quizId ||
    !createdAt
  ) {
    return res.status(400).json({ message: badRequest });
  }

  const userDetails = await getTokenCount(userId);
  const price = await getProductPrice();
  const tokensRequired = price?.products?.NORMAL || 25;

  if (!userDetails?.tokens) {
    return res.status(500).json({ message: internalServerErr });
  } else if (userDetails?.tokens < tokensRequired) {
    return res
      .status(403)
      .json({ message: "You don not have enough tokens to host event" });
  } else {
    try {
      const session = client.startSession();
      session.startTransaction();
      const db = await mongoConnectionUtils.getDB();
      const userCollection = db.collection("users");
      const eventsCollection = db.collection("events");

      const userQuery = { userId };
      const userUpdate = {
        $set: {
          tokens: userDetails?.tokens - tokensRequired
        }
      };
      const dbOptions = { upsert: true };
      await userCollection.updateOne(userQuery, userUpdate, dbOptions);
      const eventCreated = await eventsCollection.insertOne({
        eventId,
        eventName,
        quizId,
        timing,
        additionalInfo,
        userId,
        startTime,
        createdAt
      });
      await session.commitTransaction();

      if (eventCreated) {
        return res.status(200).json({ message: "Event created successfully" });
      }
      res.status(500).json({ message: internalServerErr });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: internalServerErr });
    }
  }
};

export const getMyEvents = async (req, res) => {
  const { userId } = req.query;
  const db = await mongoConnectionUtils.getDB();
  try {
    const result = await db
      .collection("events")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    if (result) {
      console.log(result);
      return res.status(200).json({ message: "Fetched successfully", result });
    }
    res.status(500).json({ message: internalServerErr });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: internalServerErr });
  }
};

export const deleteMyQuiz = async (req, res) => {
  const { quizId } = req.query;
  const db = await mongoConnectionUtils.getDB();
  try {
    const result = await db.collection("quiz").deleteOne({ quizId });
    if (result) {
      return res.status(200).json({ message: "Deleted successfully", result });
    }
    res.status(500).json({ message: internalServerErr });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: internalServerErr });
  }
};

export const getMyEventDetails = async (req, res) => {
  const { eventId, userEventId, userTime } = req.query;
  const db = await mongoConnectionUtils.getDB();
  try {
    const eventsRes = await db.collection("events").find({ eventId }).toArray();

    if (eventsRes?.length) {
      if (eventsRes?.[0]?.startTime > userTime)
        return res.status(200).json({
          message: "Fetched successfully",
          eventsRes,
          quizRes: [],
          userEventData: []
        });
      const quizRes = await db
        .collection("quiz_slides")
        .find({ quizId: eventsRes?.[0]?.quizId?.id })
        .toArray();

      if (quizRes?.length) {
        const userEventData = await db
          .collection("user_event_data")
          .find({ userEventId })
          .toArray();
        return res.status(200).json({
          message: "Fetched successfully",
          eventsRes,
          quizRes,
          userEventData
        });
      }
    }
    res.status(500).json({ message: internalServerErr });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: internalServerErr });
  }
};

export const registerUserForEvent = async (req, res) => {
  const { name, email, additionalInfo, userEventId, eventId } = req.body;
  try {
    const db = await mongoConnectionUtils.getDB();
    const foundUser = await db
      .collection("user_event_data")
      .find({ $and: [{ email }, { eventId }] })
      .toArray();

    if (!foundUser?.length) {
      const registerUser = await db
        .collection("user_event_data")
        .insertOne({ name, email, additionalInfo, userEventId, eventId });
      if (registerUser) {
        console.log(registerUser);
        return res.status(200).json({
          message: "Registered user successfully",
          userData: {
            name,
            email,
            additionalInfo,
            eventId,
            userEventId
          }
        });
      }
    } else {
      const user = foundUser?.[0];
      console.log(user);
      if (email !== user?.email || additionalInfo !== user?.additionalInfo) {
        return res
          .status(401)
          .json({ message: "Please provide correct information" });
      }
      return res.status(200).json({ userData: foundUser?.[0] });
    }

    return res.status(500).json({ message: internalServerErr });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: internalServerErr });
  }
};

export const submitAnswer = async (req, res) => {
  const { userEventId, key, value, answerStats } = req.body;
  const db = await mongoConnectionUtils.getDB();
  try {
    const quizQuery = { userEventId };
    const quizUpdate = {
      $set: {
        [`questionData.${key}`]: value,
        answerStats
      }
    };
    const dbOptions = { upsert: true };
    const isUpdated = await db
      .collection("user_event_data")
      .updateOne(quizQuery, quizUpdate, dbOptions);
    if (isUpdated) {
      return res.status(200).json({ message: "Answer submitted" });
    }

    return res
      .status(500)
      .json({ message: "unable to submit answer retry again" });
  } catch (error) {
    res.status(500).json({ message: internalServerErr });
  }
};

export const finishQuiz = async (req, res) => {
  const { userEventId, time } = req.query;
  const db = await mongoConnectionUtils.getDB();
  try {
    const quizQuery = { userEventId };
    const quizUpdate = {
      $set: {
        finished: true,
        finishTime: time
      }
    };
    const dbOptions = { upsert: true };
    const isUpdated = await db
      .collection("user_event_data")
      .updateOne(quizQuery, quizUpdate, dbOptions);
    if (isUpdated) {
      return res
        .status(200)
        .json({ message: "You have completed your quiz successfully" });
    }

    return res
      .status(500)
      .json({ message: "unable to complete the task, please try again" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: internalServerErr });
  }
};

export const getEventResult = async (req, res) => {
  const { eventId } = req.query;
  const db = await mongoConnectionUtils.getDB();
  try {
    const result = await db
      .collection("user_event_data")
      .aggregate([
        // Match documents where the eventId matches the specific value
        {
          $match: {
            eventId
          }
        },
        // Project the necessary fields and handle finishTime being null
        {
          $project: {
            email: "$email",
            name: "$name",
            additionalInfo: "$additionalInfo",
            rightAnswers: "$answerStats.right",
            wrongAnswers: "$answerStats.wrong",
            attended: "$answerStats.attended",
            finishTime: "$finishTime"
          }
        },
        // Sort by rightAnswers in descending order and finishTime in ascending order
        {
          $sort: {
            rightAnswers: -1,
            finishTime: 1
          }
        }
      ])
      .toArray();
    res.status(200).json({
      message: "Event results fetched succefully",
      resultData: result
    });
  } catch (err) {
    console.log(err);
  }
};
