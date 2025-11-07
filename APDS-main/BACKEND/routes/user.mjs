// routes/user.mjs - COMPLETELY FIXED VERSION
import express from "express";
import { ObjectId } from 'mongodb';
import db from "../db/conn.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
import checkauth from "../check-auth.mjs";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";

function clean(value) {
  if (typeof value !== "string") return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

const router = express.Router();

// Rate limits
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, 
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many attempts, please try again later'
    });
  }
});

const limiterSignup = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many sign up attempts, please try again later'
    });
  }
});

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);

// Session store to prevent duplicate requests
const pendingRequests = new Map();

function getRequestKey(req) {
  return `${req.method}-${req.path}-${req.user?.accountNumber}-${JSON.stringify(req.body)}`;
}

router.post("/signup", limiterSignup, async (req, res) => {
  const { fullName: rawFullName, idNumber: rawIdNumber, accountNumber: rawAccountNumber, name: rawName, password } = req.body;
  
  if (!rawFullName || !rawIdNumber || !rawAccountNumber || !rawName || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Sanitize inputs
  const fullName = clean(rawFullName);
  const name = clean(rawName);
  const idNumber = String(rawIdNumber).trim();
  const accountNumber = String(rawAccountNumber).trim();
  
  // Validation regex
  const fullNameRegex = /^[A-Za-z ]{2,}$/;
  const idNumberRegex = /^\d{9}$/;
  const accountNumberRegex = /^\d{8,12}$/;
  const nameRegex = /^\w{3,15}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

  // Validate inputs
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
        return res.status(409).json({message: "Username or account number already in use"});
    }

    const SALT_ROUNDS = 12;
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    let newDocument = {
        fullName,
        idNumber,
        accountNumber,
        name,
        password: hashed,
        balance: 0,
        createdAt: new Date()
    };
    
    let result = await collection.insertOne(newDocument);
    res.status(201).json({message: "User created successfully", id: result.insertedId});
    
  } catch (e) {
    console.error("Signup error:", e);
    if (!res.headersSent) {
      res.status(500).json({ message: "Signup failed. Please try again." });
    }
  }
});

router.post("/login", limiter, bruteforce.prevent, async (req, res) => {
    const { name, accountNumber, password } = req.body;
    
    if (!name || !accountNumber || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }
    
    try {
        const collection = await db.collection("users");
        const user = await collection.findOne({ name, accountNumber });

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT
        const jti = crypto.randomBytes(16).toString("hex");
        const token = jwt.sign(
          {
            name: user.name,
            accountNumber: user.accountNumber,
            role: user.role,
            jti,
            ip: req.ip,
            ua: req.headers["user-agent"]
          },
          "this_secret_should_be_longer_than_it_is",
          { expiresIn: "30m" }
        );

        // Set cookie - modified for development
        res.cookie("session", token, {
            httpOnly: true, 
            secure: true, 
            sameSite: "none", 
            maxAge: 30 * 60 * 1000 // 30 mins
        });
        
        res.status(200).json({
            message: "Login successful",
            name: user.name,
            accountNumber: user.accountNumber,
            role: user.role
        });
        
    } catch (error) {
        console.error("Login error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Login failed" });
        }
    }
});

// FIXED TRANSFER ROUTE - Prevents double transfers and handles edge cases
router.post("/transfer", limiter, checkauth, async (req, res) => {
    const requestKey = getRequestKey(req);
    
    // Prevent duplicate requests
    if (pendingRequests.has(requestKey)) {
        return res.status(429).json({ message: "Request already processing" });
    }
    
    pendingRequests.set(requestKey, true);
    
    const { toAccountNumber: rawToAccountNumber, amount: rawAmount } = req.body;
    const fromAccountNumber = req.user.accountNumber;

    // Clean and validate inputs
    const toAccountNumber = String(rawToAccountNumber || "").trim();
    const amount = parseFloat(rawAmount);

    // Input validation
    if (!toAccountNumber || rawAmount === undefined || rawAmount === null || amount <= 0 || isNaN(amount)) {
        pendingRequests.delete(requestKey);
        return res.status(400).json({ message: "Invalid transfer details. Amount must be a positive number." });
    }

    const amountRegex = /^\d+(\.\d{1,2})?$/;
    const toAccountNumberRegex = /^\d{8,12}$/;

    if (!amountRegex.test(rawAmount.toString()) || amount <= 0) {
        pendingRequests.delete(requestKey);
        return res.status(400).json({ message: "Amount must be a positive number with up to 2 decimal places." });
    }

    if (!toAccountNumberRegex.test(toAccountNumber)) {
        pendingRequests.delete(requestKey);
        return res.status(400).json({ message: "Recipient account number must be 8–12 digits." });
    }

    if (fromAccountNumber === toAccountNumber) {
        pendingRequests.delete(requestKey);
        return res.status(400).json({ message: "Cannot transfer to your own account" });
    }

    try {
        const transfers = db.collection("transfers");
        
        
        const pendingTransfer = {
            from: fromAccountNumber,
            to: toAccountNumber,
            amount: amount,
            date: new Date(),
            status: "pending", 
            type: "transfer",
            requestedBy: req.user.name,
            requestedByAccount: fromAccountNumber
        };
        
        const result = await transfers.insertOne(pendingTransfer);
        
        // Notify admins (you can implement real-time notifications here)
        console.log(`Transfer pending approval: ${amount} from ${fromAccountNumber} to ${toAccountNumber}`);
        
        res.status(200).json({ 
            message: "Transfer request submitted. Waiting for admin approval.",
            transferId: result.insertedId,
            status: "pending"
        });

    } catch (error) {
        console.error("Transfer request error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Transfer request failed. Please try again." });
        }
    } finally {
        pendingRequests.delete(requestKey);
    }
});




router.post("/add-funds", limiter, checkauth, async (req, res) => {
    const { amount: rawAmount } = req.body;
    const accountNumber = req.user.accountNumber;

    const amount = parseFloat(rawAmount);

    // FIXED: Better validation for add-funds too
    if (rawAmount === undefined || rawAmount === null || amount <= 0 || isNaN(amount)) {
        return res.status(400).json({ message: "Invalid amount. Amount must be a positive number." });
    }

    const amountRegex = /^\d+(\.\d{1,2})?$/;
    if (!amountRegex.test(rawAmount.toString()) || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number with up to 2 decimal places." });
    }

    const session = db.client.startSession();
    
    try {
        await session.withTransaction(async () => {
            const collection = db.collection("users");
            
            // Update balance
            const result = await collection.updateOne(
                { accountNumber },
                { $inc: { balance: amount } },
                { session }
            );

            if (result.modifiedCount === 0) {
                throw new Error("Account not found");
            }

            // Log the transaction
            const transfers = db.collection("transfers");
            await transfers.insertOne({
                from: "SYSTEM",
                to: accountNumber,
                amount: amount,
                date: new Date(),
                type: "deposit"
            }, { session });
        });

        res.status(200).json({ 
            message: "Funds added successfully",
            amount: amount
        });

    } catch (error) {
        console.error("Add funds error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to add funds" });
        }
    } finally {
        await session.endSession();
    }
});

router.get("/transfers", checkauth, async (req, res) => {
  try {
    const transfers = await db.collection("transfers")
      .find({ 
        $or: [
          { from: req.user.accountNumber }, 
          { to: req.user.accountNumber }
        ]
      })
      .sort({ date: -1 })
      .limit(50)
      .toArray();
      
    res.json(transfers);
  } catch (error) {
    console.error("Error fetching transfers:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Could not fetch transfers" });
    }
  }
});

router.get("/balance", limiter, checkauth, async (req, res) => {
  try {
    const user = await db.collection("users").findOne({
      accountNumber: req.user.accountNumber
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transfers = await db.collection("transfers")
      .find({
        $or: [
          { from: req.user.accountNumber },
          { to: req.user.accountNumber }
        ],
        status: { $ne: "rejected" } 
      })
      .toArray();

    let totalSent = 0;
    let totalReceived = 0;

     transfers.forEach(t => {
      
      if (!t.status || t.status === "approved" || t.status === "completed") {
        if (t.from === req.user.accountNumber) totalSent += t.amount;
        if (t.to === req.user.accountNumber) totalReceived += t.amount;
      }
    });

    res.json({
      balance: user.balance || 0,
      totalSent,
      totalReceived,
      accountNumber: user.accountNumber,
      name: user.name
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error fetching balance data" });
    }
  }
});

// Logout route
router.post("/logout", (req, res) => {
  res.clearCookie("session", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  res.json({ message: "Logged out successfully" });
});

export default router;