import https from "https";
import http from "http"
import fs from "fs";
import fruits from "./routes/fruit.mjs"
import users from "./routes/user.mjs"
import posts from "./routes/post.mjs"
import express from "express"
import assert from "assert";
import cors from "cors"
import db from "./db/conn.mjs";
import rateLimit from "express-rate-limit";

const PORT = 3000;
const app = express();

//cookie parser for reading cookies for session validation
import cookieParser from "cookie-parser";


const options = {
    key: fs.readFileSync('keys/mongodb-key.pem'),
    cert: fs.readFileSync('keys/mongodb-cert.pem')
}


const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: 'Too many requests from this IP, try again later'
})

app.use(limiter);

app.use(cors());
app.use(express.json());

app.use(cookieParser()); // enables reading secure cookies for session validation


app.use((req, res, next) => 
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    next();
}
)

app.use("/fruit", fruits);
app.route("/fruit", fruits);
app.use("/post", posts);
app.route("/post", posts);
app.use("/user", users);
app.route("/user", users);

// root endpoint for quick server check
app.get("/", (req, res) => {
    res.send("Server is running. Use /test-db to test MongoDB connection.");
});

// Test MongoDB connection with Postman: Send GET request to https://localhost:3000/test-db
app.get("/test-db", async (req, res) => {
    try {
        const collections = await db.listCollections().toArray();
        res.json({ status: "success", collections });
    } catch (e) {
        res.status(500).json({ status: "error", error: e.message });
    }
});



let server = https.createServer(options, app)
console.log(PORT)
server.listen(PORT);