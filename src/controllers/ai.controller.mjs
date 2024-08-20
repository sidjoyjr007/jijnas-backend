import OpenAI from "openai";
import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { getTokenCount } from "./quiz.controller.mjs";
import strings from "../constants/strings.mjs";
import mongoConnectionUtils from "../utils/mongo-connection.utils.mjs";
import { getProductPrice } from "./utils.controller.mjs";

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
        stream: true
      });
      for await (const chunk of response) {
        if (chunk.choices[0]?.delta?.content) {
          fullResponse += chunk.choices[0]?.delta?.content;
        }
        process.stdout.write(chunk.choices[0]?.delta?.content || "");
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
        return res.status(200).json({ response: fullResponse });
      }

      //   const payloads = chunk.toString().split("\n\n");
      //   for (const payload of payloads) {
      //     if (payload.includes("[DONE]")) return;
      //     if (payload.trim()) {
      //       const data = JSON.parse(payload.replace(/^data: /, ""));
      //       const content = data.choices[0].delta.content || "";
      //       fullResponse += content; // Append the content to the full response
      //       console.log(content); // Optionally, log the streamed content
      //     }
      //   }
      // });

      // response.on("end", async () => {
      //   console.log("Stream finished.");
      //   console.log("Full Response:", fullResponse); // Print the entire response
      //   const db = await mongoConnectionUtils.getDB();
      //   const userCollection = db.collection("users");
      //   const userQuery = { userId };
      //   const userUpdate = {
      //     $set: {
      //       tokens: userDetails?.tokens - tokensRequired
      //     }
      //   };
      //   const dbOptions = { upsert: true };
      //   const userAck = await userCollection.updateOne(
      //     userQuery,
      //     userUpdate,
      //     dbOptions
      //   );
      //   if (userAck) {
      //     return res.status(200).json({ response: fullResponse });
      //   }
      // });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ err });
    }
  }
};

export const uploadFile = async (req, res) => {
  console.log(path.resolve("C:/Users/91761/Desktop/quizzy-server/1.pdf"));
  try {
    const file = await openai.files.create({
      file: fs.createReadStream(
        path.resolve("C:/Users/91761/Desktop/quizzy-server/1.pdf")
      ),
      purpose: "assistants"
    });
    console.log(file);
    return res.status(200).json({ message: "File uploaded Successfully" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Unable to upload file, please try agian later" });
  }
};

export const listFiles = async (req, res) => {
  try {
    const list = await openai.files.list();

    for await (const file of list) {
      console.log(file);
    }
    return res.status(200).json({ list });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load Files" });
  }
};

// export const generateAIQuestionsFromFile = async (req, res) => {
//   const { question, userId, tokensRequired } = req.body;
//   if (!question || !userId || !tokensRequired) {
//     return res.status(400).json({ message: badRequest });
//   }
//   const userDetails = await getTokenCount(userId);
//   if (!userDetails?.tokens) {
//     return res.status(500).json({ message: internalServerErr });
//   } else if (userDetails?.tokens < tokensRequired) {
//     return res
//       .status(403)
//       .json({ message: "You don not have enough tokens to generate quiz" });
//   } else {
//     try {
//       const response = await openai.chat.completions.create({
//         model: MODEL,
//         messages: [{ role: "user", content: question }],
//         response_format: { type: "json_object" }
//       });
//       const db = await mongoConnectionUtils.getDB();
//       const userCollection = db.collection("users");
//       const userQuery = { userId };
//       const userUpdate = {
//         $set: {
//           tokens: userDetails?.tokens - tokensRequired
//         }
//       };
//       const dbOptions = { upsert: true };
//       const userAck = await userCollection.updateOne(
//         userQuery,
//         userUpdate,
//         dbOptions
//       );
//       if (userAck) {
//         return res.status(200).json({ response });
//       }
//     } catch (err) {
//       console.log(err);
//       return res.status(500).json({ err });
//     }
//   }
// };
