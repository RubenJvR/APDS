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
const HTTP_PORT  = process.env.HTTP_PORT  || 3001; // plain-HTTP catcher port for friendly errors

const app = express();

// === TLS options (replace with your real cert/key in production) ===
const options = {
  key: fs.readFileSync("keys/mongodb-key.pem"),
  cert: fs.readFileSync("keys/mongodb-cert.pem")
};

// === Security / general middleware ===
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: "Too many requests from this IP, try again later"
});
app.use(limiter);

// sanitize input to prevent MongoDB operator injection
app.use(mongoSanitize());

// Allow JSON bodies (single call)
app.use(express.json({ limit: "10kb" }));

// cookies (for your secure httpOnly session cookie)
app.use(cookieParser());

// use helmet and explicit frameguard
app.use(helmet());
app.use(helmet.frameguard({ action: "deny" }));

// CORS - currently permissive; tighten in production
app.use(cors());
// If you still need custom headers, consider limiting them in production:
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  next();
});

// === Routes ===
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

// === Create HTTPS server ===
const httpsServer = https.createServer(options, app);
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`✅ HTTPS server listening on https://localhost:${HTTPS_PORT}`);
});

// === Create HTTP server to return a friendly JSON error ===
const httpServer = http.createServer((req, res) => {
  // Option A: Return an explicit JSON error (403 or 426)
  res.writeHead(426, { "Content-Type": "application/json" }); // 426 Upgrade Required
  res.end(JSON.stringify({
    error: "Insecure connection detected. Please use HTTPS.",
    instructions: `Use https://localhost:${HTTPS_PORT}${req.url}`
  }));

  // --- Option B: (alternative) Redirect to HTTPS instead of returning error
  // const host = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
  // res.writeHead(301, { Location: `https://${host}:${HTTPS_PORT}${req.url}` });
  // res.end();
});
httpServer.listen(HTTP_PORT, () => {
  console.log(`🚫 Plain HTTP catcher listening on http://localhost:${HTTP_PORT}`);
  console.log(`→ Plain HTTP requests to this port will receive a JSON error advising HTTPS.`);
});
