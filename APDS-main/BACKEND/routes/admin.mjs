import express from "express";
import db from "../db/conn.mjs";
import bcrypt from "bcrypt";
import checkauth from "../check-auth.mjs";
import rateLimit from "express-rate-limit";
import sanitizeHtml from "sanitize-html";

function clean(value) {
  if (typeof value !== "string") return value;
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

const router = express.Router();

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 50,
    message: 'Too many attempts, please try again later'
});

router.post("/add-user", limiter, checkauth, async (req, res) => {
    // Verify admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    const { fullName: rawFullName, idNumber: rawIdNumber, accountNumber: rawAccountNumber, name: rawName, password, initialBalance } = req.body;
  
    if (!rawFullName || !rawIdNumber || !rawAccountNumber || !rawName || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // Sanitize inputs
    const fullName = clean(rawFullName);
    const name = clean(rawName);
    const idNumber = String(rawIdNumber).trim();
    const accountNumber = String(rawAccountNumber).trim();
    
    // Validation regex
     const fullNameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
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
            balance: initialBalance || 0,
            createdAt: new Date(),
            createdBy: req.user.name
        };
        
        let result = await collection.insertOne(newDocument);

        // Log the user creation
        const transfers = db.collection("transfers");
        if (initialBalance > 0) {
            await transfers.insertOne({
                from: "ADMIN",
                to: accountNumber,
                amount: initialBalance,
                date: new Date(),
                type: "initial_deposit"
            });
        }

        res.status(201).json({
            message: "User created successfully", 
            id: result.insertedId
        });
        
    } catch (e) {
        console.error("Admin add user error:", e);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to create user" });
        }
    }
});

router.get("/users", limiter, checkauth, async (req, res) => {
    // Verify admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    try {
        
        const collection = db.collection("users");
        

        const users = await collection.find({}).project({password:0}).toArray();
        
        res.status(200).json({users});
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Could not fetch users" });
    }
});

export default router;