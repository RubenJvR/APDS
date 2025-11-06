// server.mjs - FIXED VERSION
import https from "https";
import http from "http";
import fs from "fs";
import express from "express";
import cors from "cors";
import db from "./db/conn.mjs";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import users from "./routes/user.mjs";
import admin from "./routes/admin.mjs"; 

const HTTPS_PORT = process.env.HTTPS_PORT || 3000;
const HTTP_PORT  = process.env.HTTP_PORT  || 3001;

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: [
    "https://localhost:3002",  
    "https://localhost:3000",  
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"]
}));

// Middleware
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(helmet());
app.use(helmet.frameguard({ action: "deny" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, try again later"
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Mount routes
app.use("/user", users);
app.use("/admin", admin);
// Test routes
app.get("/", (req, res) => {
  res.json({ 
    message: "HTTPS Server is running successfully!",
    endpoints: {
      test: "/test-db",
      user: "/user/*",
      admin: "/admin/*"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    server: "Backend API"
  });
});

app.get("/test-db", async (req, res) => {
  try {
    const collections = await db.listCollections().toArray();
    res.json({ 
      status: "success", 
      collections: collections.map(c => c.name),
      db: "Connected"
    });
  } catch (e) {
    res.status(500).json({ status: "error", error: e.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled Error:', error);
  if (!res.headersSent) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Create HTTPS server (optional)
let httpsServer;
try {
  const options = {
    key: fs.readFileSync("keys/mongodb-key.pem"),
    cert: fs.readFileSync("keys/mongodb-cert.pem")
  };
  httpsServer = https.createServer(options, app);
  httpsServer.listen(HTTPS_PORT, () => {
    console.log(`✅ HTTPS server listening on https://localhost:${HTTPS_PORT}`);
  });
} catch (error) {
  console.log(`⚠️  HTTPS server not started: ${error.message}`);
}

// HTTP server (primary for development)
const httpApp = express();

// Apply same middleware to HTTP app
httpApp.use(cors({
  origin: true, // Allow all origins for development
  credentials: true,
}));
httpApp.use(express.json());
httpApp.use(cookieParser());
httpApp.use(limiter);

// Mount the same routes on HTTP
httpApp.use("/user", users);
httpApp.use("/admin", admin);

httpApp.get("/", (req, res) => {
  res.json({ 
    message: "HTTP API Server is running!",
    note: "Use this endpoint for development",
    baseUrl: `http://localhost:${HTTP_PORT}`
  });
});

httpApp.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    server: "HTTP Development Server"
  });
});

// Error handling for HTTP app
httpApp.use((error, req, res, next) => {
  console.error('HTTP App Error:', error);
  if (!res.headersSent) {
    res.status(500).json({ message: "Internal server error" });
  }
});

const httpServer = http.createServer(httpApp);
httpServer.listen(HTTP_PORT, () => {
  console.log(`✅ HTTP API Server listening on http://localhost:${HTTP_PORT}`);
  console.log(`🔗 Test connection: http://localhost:${HTTP_PORT}/health`);
  console.log(`👤 User routes: http://localhost:${HTTP_PORT}/user/`);
  console.log(`👑 Admin routes: http://localhost:${HTTP_PORT}/admin/`);
  console.log(`🗄️  Database test: http://localhost:${HTTP_PORT}/test-db`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});