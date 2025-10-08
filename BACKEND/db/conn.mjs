import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();


const connectionString =
  process.env.ATLAS_URI ||
  "mongodb+srv://d3mwize_db_user:XsfwfRh29R8rqubi@adps-cluster.vbz68yu.mongodb.net/users?retryWrites=true&w=majority&tls=true";

console.log("Connecting to MongoDB...");

const client = new MongoClient(connectionString, {

  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsAllowInvalidCertificates: false, 
  serverSelectionTimeoutMS: 10000, 
});

let db;

try {
  await client.connect();
  console.log(" MongoDB is CONNECTED!!! :)");
  db = client.db("users");
} catch (err) {
  console.error(" MongoDB connection error:", err.message);
}

export default db;
