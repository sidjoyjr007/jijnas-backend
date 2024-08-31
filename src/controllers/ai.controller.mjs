import OpenAI from "openai";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getTokenCount } from "./quiz.controller.mjs";
import strings from "../constants/strings.mjs";
import mongoConnectionUtils from "../utils/mongo-connection.utils.mjs";
import { getProductPrice } from "./utils.controller.mjs";
import { fileURLToPath } from "url";
import { signJWT } from "../utils/jwt.utils.mjs";
const { badRequest, internalServerErr } = strings;

config();

const MODEL = "gpt-4o-mini";
const openai = new OpenAI({
  organization: process.env.ORGANIZATION_ID,
  project: process.env.PROEJECT_ID,
  apiKey: process.env.PROJECT_KEY
});

export const generateAIQuestions = async (req, res) => {
  const { question, userId } = req.body;
  if (!question || !userId) {
    return res.status(400).json({ message: badRequest });
  }
  const userDetails = await getTokenCount(userId);
  const price = await getProductPrice();
  const tokensRequired = price?.products?.AI || 50;
  if (!userDetails?.tokens && userDetails?.tokens !== 0) {
    return res.status(500).json({ message: internalServerErr });
  } else if (userDetails?.tokens < tokensRequired) {
    return res
      .status(403)
      .json({ message: "You don not have enough tokens to generate quiz" });
  } else {
    try {
      let fullResponse = "";
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: question }],
        response_format: { type: "json_object" },
        stream: true,
        temperature: 0.7,
        // top_p: 1,
        // frequency_penalty: 0.5,
        presence_penalty: 0.5
      });
      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          fullResponse += chunk.choices[0]?.delta?.content;
        }
      }

      const db = await mongoConnectionUtils.getDB();
      const userCollection = db.collection("users");
      const userQuery = { userId };
      const userUpdate = {
        $set: {
          tokens: userDetails?.tokens - tokensRequired
        }
      };
      const dbOptions = { upsert: true };
      const userAck = await userCollection.updateOne(
        userQuery,
        userUpdate,
        dbOptions
      );
      if (userAck) {
        const accessToken = signJWT(
          {
            email: userDetails?.email,
            name: userDetails?.name,
            userId: userDetails?.userId
          },
          "30m"
        );

        const refreshToken = signJWT(
          {
            email: userDetails?.email,
            name: userDetails?.name,
            userId: userDetails?.userId
          },
          "1y"
        );

        // Set access and refresh token in cookie
        const sessionData = { accessToken, refreshToken };

        res.cookie("__session", JSON.stringify(sessionData), {
          maxAge: 1800000,
          domain: ".quiznex.com",

          path: "/",
          secure: true,
          httpOnly: true,
          sameSite: "None"
        });

        // res.cookie("refreshToken", refreshToken, {
        //   maxAge: 3.154e10, // 1 year
        //   //domain: ".quiznex.com",

        //   path: "/",
        //   secure: true,
        //   httpOnly: true,
        //   sameSite: "None"
        // });
        return res.status(200).json({ response: fullResponse });
      }
    } catch (err) {
      return res.status(500).json({ err });
    }
  }
};

export const regenerateInFile = async (req, res) => {
  const {
    fileId,
    assistantId,
    vectoreStoreId,
    threadId,
    userId,
    instructions
  } = req?.body;
  if (!fileId || !assistantId || !vectoreStoreId || !threadId) {
    return res.status(400).json({ message: badRequest });
  }

  const fileSizIn100KBCount = Math.ceil(req?.file?.size / 1024 / 100);
  const userDetails = await getTokenCount(userId);
  const price = await getProductPrice();
  const tokensRequired =
    fileSizIn100KBCount <= 6
      ? price?.products?.MIN_FILE_TOKEN
      : fileSizIn100KBCount * price?.products?.FILE_100KB || 30;
  if (!userDetails?.tokens && userDetails?.tokens !== 0) {
    return res.status(500).json({ message: internalServerErr });
  } else if (userDetails?.tokens < tokensRequired) {
    return res
      .status(403)
      .json({ message: "You don not have enough tokens to generate quiz" });
  } else {
    try {
      const assistant = await openai.beta.assistants.create({
        name: `file_search_assistan_${uuidv4()}`,
        instructions:
          instructions ||
          "You are a helpful assistant. Use the knowledge from uploaded files to generate multiple choice quizzes.",
        model: "gpt-4o-mini",
        tools: [{ type: "file_search" }],
        temperature: 0.8
      });

      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: `Generate a list of unique exactly 15-20 multiple-choice quizzes on the attached file remember previous context do not give same questions again. The response must strictly include exactly 15-20 questions. If the response contains fewer or more questions, it will not be accepted.
  Please verify that the total number of questions is 15-20 and provide all questions in one response in the following JSON format:
  Expected JSON Format:
  {
  "quizzes":
    [
      {
        "question": "<Enter the quiz question here>",
        "options": [
          {
            "value": "<Enter the option text here>",
            "rightAnswer": <true/false to indicate the correct answer>
          }
        ],
        "explanation": "<Provide an explanation if necessary>",
        "questionName": "<Assign a concise one-word name for the question, but name should not reveal answer>"
      }
    ]
  }
  1. Provide exactly 15-20 distinct questions.
  2. Ensure each question is unique, relevant, and has the correct format.
  3. Include explanations where necessary.
  Ensure the total number of questions matches exactly 15-20 and provide all questions in one response.`
          }
        ],
        tool_resources: { file_search: { vector_store_ids: [vectoreStoreId] } }
      });
      // Run the thread and get the response
      const stream = openai.beta.threads.runs.stream(thread.id, {
        assistant_id: assistant.id,
        instructions:
          instructions ||
          "Do not repeat same questions as earlier always provide unique ones",
        temperature: 0.8
      });

      stream.on("messageDone", (event) => {
        if (event.content[0].type === "text") {
          const accessToken = signJWT(
            {
              email: userDetails?.email,
              name: userDetails?.name,
              userId: userDetails?.userId
            },
            "30m"
          );

          const refreshToken = signJWT(
            {
              email: userDetails?.email,
              name: userDetails?.name,
              userId: userDetails?.userId
            },
            "1y"
          );
          const sessionData = { accessToken, refreshToken };

          res.cookie("__session", JSON.stringify(sessionData), {
            maxAge: 1800000,
            domain: ".quiznex.com",
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "None"
          });

          // res.cookie("refreshToken", refreshToken, {
          //   maxAge: 3.154e10, // 1 year
          //   //domain: ".quiznex.com",

          //   path: "/",
          //   secure: true,
          //   httpOnly: true,
          //   sameSite: "None"
          // });
          res.status(200).json({
            answer: event.content[0].text,
            message: "Quiz generated successfully",
            fileId: fileId,
            assistant: assistantId,
            vectorStore: vectoreStoreId
          });
        }
      });
    } catch (err) {
      res.status(500).json({
        message: internalServerErr
      });
    }
  }
};

export const fileAssistant = async (req, res) => {
  const { userId, instructions } = req.body;
  if (!userId || !req?.file) {
    return res.status(400).json({ message: badRequest });
  }

  const fileSizIn100KBCount = Math.ceil(req?.file?.size / 1024 / 100);
  const userDetails = await getTokenCount(userId);
  const price = await getProductPrice();
  const tokensRequired =
    fileSizIn100KBCount <= 6
      ? price?.products?.MIN_FILE_TOKEN
      : fileSizIn100KBCount * price?.products?.FILE_100KB || 30;
  if (!userDetails?.tokens && userDetails?.tokens !== 0) {
    return res.status(500).json({ message: internalServerErr });
  } else if (userDetails?.tokens < tokensRequired) {
    return res
      .status(403)
      .json({ message: "You don not have enough tokens to generate quiz" });
  } else {
    try {
      // Create an assistant
      const assistant = await openai.beta.assistants.create({
        name: `file_search_assistan_${uuidv4()}`,
        instructions:
          instructions ||
          "You are a helpful assistant. Use the knowledge from uploaded files to generate multiple choice quizzes.",
        model: "gpt-4o-mini",
        tools: [{ type: "file_search" }],
        temperature: 0.8
      });
      //  assistant.id;
      const filePath = req.file.path;
      // Upload the file to OpenAI
      const fileStream = fs.createReadStream(filePath);
      const file = await openai.files.create({
        file: fileStream,
        purpose: "assistants"
      });
      const vectorStore = await openai.beta.vectorStores.create({
        name: "My Vector Store",
        file_ids: [file.id]
      });
      const thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: `Generate a list of unique exactly 15-20 multiple-choice quizzes on the attached file remember previous context do not give same questions again. The response must strictly include exactly 15-20 questions. If the response contains fewer or more questions, it will not be accepted.
  Please verify that the total number of questions is 15-20 and provide all questions in one response in the following JSON format:
  Expected JSON Format:
  {
  "quizzes":
    [
      {
        "question": "<Enter the quiz question here>",
        "options": [
          {
            "value": "<Enter the option text here>",
            "rightAnswer": <true/false to indicate the correct answer>
          }
        ],
        "explanation": "<Provide an explanation if necessary>",
        "questionName": "<Assign a concise one-word name for the question, but name should not reveal answer>"
      }
    ]
  }
  1. Provide exactly 15-20 distinct questions.
  2. Ensure each question is unique, relevant, and has the correct format.
  3. Include explanations where necessary.
  Ensure the total number of questions matches exactly 15-20 and provide all questions in one response.`
          }
        ],
        tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } }
      });
      // Run the thread and get the response
      const stream = openai.beta.threads.runs.stream(thread.id, {
        assistant_id: assistant.id
      });
      stream.on("messageDone", (event) => {
        if (event.content[0].type === "text") {
          deleteAllFilesInFolder();
          const accessToken = signJWT(
            {
              email: userDetails?.email,
              name: userDetails?.name,
              userId: userDetails?.userId
            },
            "30m"
          );

          const refreshToken = signJWT(
            {
              email: userDetails?.email,
              name: userDetails?.name,
              userId: userDetails?.userId
            },
            "1y"
          );

          // Set access and refresh token in cookie
          const sessionData = { accessToken, refreshToken };

          res.cookie("__session", JSON.stringify(sessionData), {
            maxAge: 1800000,
            domain: ".quiznex.com",
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "None"
          });

          // res.cookie("refreshToken", refreshToken, {
          //   maxAge: 3.154e10, // 1 year
          //   //domain: ".quiznex.com",

          //   path: "/",
          //   secure: true,
          //   httpOnly: true,
          //   sameSite: "None"
          // });
          res.status(200).json({
            answer: event.content[0].text,
            message: "Quiz generated successfully",
            fileId: file.id,
            assistant: assistant.id,
            vectorStore: vectorStore.id,
            thread: thread.id
          });
        }
      });
    } catch (err) {
      console.log(err);
      deleteAllFilesInFolder();

      res.status(500).json({
        message: internalServerErr
      });
    }
  }
};

const deleteAllFilesInFolder = async () => {
  const __filename = fileURLToPath(import.meta.url);

  // Get the directory name of the current file
  const __dirname = path.dirname(__filename);

  const folderPath = path.join(__dirname, "./uploads");

  try {
    const files = await fs.promises.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      await fs.promises.unlink(filePath);
    }

    console.log("All files deleted successfully!");
  } catch (err) {
    console.error("Error deleting files:", err);
  }
};
