import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

// Connection URI
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.f2yrnuy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let _db;
const dbOptions = {
  wtimeout: 2500,
  connectTimeoutMS: 10000,
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Create a new MongoClient
export const client = new MongoClient(uri, dbOptions);

export default {
  connectToDB: async () => {
    try {
      const connection = await client.connect();
      if (connection) {
        console.log("Successfully connected to DB");
        _db = client.db("jijnas_quiz");
        return _db;
      }
    } catch (err) {
      console.log("DB connection failed", err);
      return false;
    }
  },

  getDB: () => _db
};
