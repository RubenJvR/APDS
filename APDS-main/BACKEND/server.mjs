// server.mjs
import https from "https";
import http from "http";
import fs from "fs";
import users from "./routes/user.mjs";
import express from "express";
import cors from "cors";
import db from "./db/conn.mjs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";

const HTTPS_PORT = process.env.HTTPS_PORT || 3000;
const HTTP_PORT  = process.env.HTTP_PORT  || 3001; // HTTP catcher port

const app = express();

// TLS options
const options = {
  key: fs.readFileSync("keys/mongodb-key.pem"),
  cert: fs.readFileSync("keys/mongodb-cert.pem")
};

// middleware 
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many requests from this IP, try again later"
});
app.use(limiter);

// sanitizes inputs
app.use(mongoSanitize());

// Allow JSON bodies 
app.use(express.json({ limit: "10kb" }));

// cookies 
app.use(cookieParser());

// use helmet framegaurd to prevent clickjacking
app.use(helmet());
app.use(helmet.frameguard({ action: "deny" }));

app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});

//  Routes 
app.use("/user", users);
app.route("/user", users);

app.get("/", (req, res) => {
  res.send("Server is running. Use /test-db to test MongoDB connection.");
});
app.get("/test-db", async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json({ status: "success", collections });
  } catch (e) {
    res.status(500).json({ status: "error", error: e.message });
  }
});

//  Creates HTTPS server
const httpsServer = https.createServer(options, app);
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`✅ HTTPS server listening on https://localhost:${HTTPS_PORT}`);
});

// Create HTTP server to return message to user
const httpServer = http.createServer((req, res) => {

  res.writeHead(426, { "Content-Type": "application/json" }); 
  res.end(JSON.stringify({
    error: "Insecure connection detected. Please use HTTPS.",
    instructions: `Use https://localhost:${HTTPS_PORT}${req.url}`
  }));

});
httpServer.listen(HTTP_PORT, () => {
  console.log(`🚫 Plain HTTP catcher listening on http://localhost:${HTTP_PORT}`);
  console.log(`→ Plain HTTP requests to this port will receive a JSON error advising HTTPS.`);
});

