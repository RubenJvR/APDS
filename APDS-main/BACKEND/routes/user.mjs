import express from "express";
import assert from "assert";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
import checkauth from "../check-auth.mjs";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";


function clean(value) {
  if (typeof value !== "string") return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

const router = express.Router();

// limits rates for requests
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, 
    max: 100,
    message: 'Too many attempts, please try again later'
});

const limiterSignup = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10,
    message: 'Too many sign up attempts, please try again later'
});

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);

router.post("/signup", limiterSignup, async (req, res) => {
  const { fullName: rawFullName, idNumber: rawIdNumber, accountNumber: rawAccountNumber, name: rawName, password } = req.body;
  if (!rawFullName || !rawIdNumber || !rawAccountNumber || !rawName || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // sanitize BEFORE validation
  const fullName = clean(rawFullName);
  const name = clean(rawName);
  const idNumber = String(rawIdNumber).trim();
  const accountNumber = String(rawAccountNumber).trim();
  
    //Regex can be changed for later
    const fullNameRegex = /^[A-Za-z ]{2,}$/;
    const idNumberRegex = /^\d{9}$/;
    const accountNumberRegex = /^\d{8,12}$/;
    const nameRegex = /^\w{3,15}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

    //checks the regex against the user entered details
    if (!fullNameRegex.test(fullName)) {
        return res.status(400).json({ message: "Full name must only contain letters and spaces." });
    }
    if (!idNumberRegex.test(idNumber)) {
        return res.status(400).json({ message: "ID number must be exactly 9 digits." });
    }
    if (!accountNumberRegex.test(accountNumber)) {
        return res.status(400).json({ message: "Account number must be 8–12 digits." });
    }
    if (!nameRegex.test(name)) {
        return res.status(400).json({ message: "Username must be 3–15 characters, letters/numbers/underscores only." });
    }
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ message: "Password must be at least 8 chars, with uppercase, lowercase, and number." });
    }
    try {

        const collection = await db.collection("users");

        const exists = await collection.findOne({
            $or: [{name}, {accountNumber}]
        });
        if(exists){
            return res.status(409).json({message: "Username, or account number already in use"})
        }

        const SALT_ROUNDS = 12;
        const hashed = await bcrypt.hash(password, SALT_ROUNDS);

        let newDocument = {
            fullName,
            idNumber,
            accountNumber,
            name,
            password: hashed,
            balance: 0 
        };
        
        let result = await collection.insertOne(newDocument);
        res.status(201).json({message: "User created", id: result});
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Signup failed." });
    }
});



router.post("/login",limiter , bruteforce.prevent, async (req, res) => {
    const { name, accountNumber, password } = req.body;
    if (!name || !accountNumber || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }
    try {
        const collection = await db.collection("users");
        const user = await collection.findOne({ name, accountNumber });

        if (!user) {
            return res.status(401).json({ message: "Authentication failed" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Authentication failed" });
        } else {
            
            // regenerate JWT with unique JWT ID for each login to prevent session fixation
            // embed IP and user agent in JWT for anomaly detection
            const jti = Math.random().toString(36).substring(2) + Date.now();
            const token = jwt.sign(
                {
                    name: user.name,
                    accountNumber: user.accountNumber,
                    jti, // unique session id
                    ip: req.ip, // users IP address
                    ua: req.headers["user-agent"] // users browser info
                },
                "this_secret_should_be_longer_than_it_is",
                { expiresIn: "30m" } // shorter expiry for security
            );
            // send the token via an HTTP only secure cookie
            res.cookie("session", token, {
                httpOnly: true, 
                secure: true, 
                sameSite: "strict", 
                maxAge: 30 * 60 * 1000 // 30 mins
            });
            
            res.status(200).json({
                message: "Authentication successful",
                name: user.name,
                accountNumber: user.accountNumber
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
})

router.post("/transfer",limiter, checkauth, async (req, res) => {
    const { toAccountNumber, amount } = req.body;
    const fromAccountNumber = req.user.accountNumber;

    const amountRegex = /^\d+$/;
    const toAccountNumberRegex = /^\d{8,12}$/;

    if (!amountRegex.test(amount)) {
        return res.status(400).json({ message: "Amount must be a number" });
    }

    if (!toAccountNumberRegex.test(toAccountNumber)) {
        return res.status(400).json({ message: "Account number must be 8–12 digits." });
    }

    if (!toAccountNumber || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid transfer details" });
    }

    try {
        const collection = await db.collection("users");
        const sender = await collection.findOne({ accountNumber: fromAccountNumber });
        const receiver = await collection.findOne({ accountNumber: toAccountNumber });

        if (!sender || !receiver) {
            return res.status(404).json({ message: "Account not found" });
        }

        if ((sender.balance || 0) < amount) {
            return res.status(400).json({ message: "Insufficient funds" });
        }

        // needed to update the balance of respective accounts on the system
        await collection.updateOne(
            { accountNumber: fromAccountNumber },
            { $inc: { balance: -amount } }
        );
        await collection.updateOne(
            { accountNumber: toAccountNumber },
            { $inc: { balance: amount } }
        );

        // inside router.post("/transfer", ...)
await collection.updateOne(
  { accountNumber: fromAccountNumber },
  { $inc: { balance: -amount } }
);
await collection.updateOne(
  { accountNumber: toAccountNumber },
  { $inc: { balance: amount } }
);

// log the transaction
const transfers = await db.collection("transfers");
await transfers.insertOne({
  from: fromAccountNumber,
  to: toAccountNumber,
  amount: parseFloat(amount),
  date: new Date()
});

res.status(200).json({ message: "Transfer successful" });


        res.status(200).json({ message: "Transfer successful" });
    } catch (error) {
        console.error("Transfer error:", error);
        res.status(500).json({ message: "Transfer failed" });
    }
});

// added this so a user would be able to add funds to their account without transferring it to themselves or something else dumb
router.post("/add-funds",limiter, checkauth, async (req, res) => {
    const { amount } = req.body;
    const accountNumber = req.user.accountNumber;

    const amountRegex = /^\d+$/;
    const accountNumberRegex = /^\d{8,12}$/;

    if (!amountRegex.test(amount)) {
        return res.status(400).json({ message: "Amount must be a number" });
    }

    if (!accountNumberRegex.test(accountNumber)) {
        return res.status(400).json({ message: "Account number must be 8–12 digits." });
    }

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
    }

    try {
        const collection = await db.collection("users");
        const result = await collection.updateOne(
            { accountNumber },
            { $inc: { balance: amount } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: "Account not found" });
        }

        res.status(200).json({ message: "Funds added successfully" });
    } catch (error) {
        console.error("Add funds error:", error);
        res.status(500).json({ message: "Failed to add funds" });
    }
});
//feel free to add a route for user balances( but checking the db works too)
router.get("/transfers", limiter, checkauth, async (req, res) => {
  try {
    const transfers = await db.collection("transfers")
      .find({ 
        $or: [
          { from: req.user.accountNumber }, 
          { to: req.user.accountNumber }
        ] 
      })
      .sort({ date: -1 })
      .toArray();
    res.json(transfers);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    res.status(500).json({ message: "Could not fetch transfers" });
  }
});

router.get("/balance", limiter, checkauth, async (req, res) => {
  try {
    const user = await db.collection("users").findOne({
      accountNumber: req.user.accountNumber
    });

    const transfers = await db.collection("transfers")
      .find({
        $or: [
          { from: req.user.accountNumber },
          { to: req.user.accountNumber }
        ]
      })
      .toArray();

    let totalSent = 0;
    let totalReceived = 0;

    transfers.forEach(t => {
      if (t.from === req.user.accountNumber) totalSent += t.amount;
      if (t.to === req.user.accountNumber) totalReceived += t.amount;
    });

    res.json({
      balance: user.balance || 0,
      totalSent,
      totalReceived
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ message: "Error fetching balance data" });
  }
});

export default router