import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from 'mongodb';
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
router.post("/approve-transfer", checkauth, async (req, res) => {
    console.log("=== APPROVE TRANSFER REQUEST ===");
    console.log("User:", req.user);
    console.log("Body:", req.body);
    
    if (req.user.role !== 'admin') {
        console.log("Unauthorized - User is not admin");
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    const { transferId } = req.body;
    console.log("Transfer ID:", transferId);
    
    if (!transferId) {
        console.log(" No transfer ID provided");
        return res.status(400).json({ message: "Transfer ID is required" });
    }

    const session = db.client.startSession();
    
    try {
        await session.withTransaction(async () => {
            const transfers = db.collection("transfers");
            const users = db.collection("users");
            
            console.log("Looking for transfer with ID:", transferId);
            
            // Get the pending transfer with lock
            const transfer = await transfers.findOne(
                { _id: new ObjectId(transferId), status: "pending" },
                { session }
            );
            
            console.log("Found transfer:", transfer);
            
            if (!transfer) {
                throw new Error("Transfer not found or already processed");
            }

            // Get sender with lock
            const sender = await users.findOne(
                { accountNumber: transfer.from },
                { session }
            );
            
            console.log(" Sender account:", sender);
            
            if (!sender) {
                throw new Error("Sender account not found");
            }

            // Get receiver
            const receiver = await users.findOne(
                { accountNumber: transfer.to },
                { session }
            );
            
            console.log("Receiver account:", receiver);
            
            if (!receiver) {
                throw new Error("Recipient account not found");
            }

            // Check balance
            console.log(`balance check: ${sender.balance} >= ${transfer.amount}`);
            if ((sender.balance || 0) < transfer.amount) {
                throw new Error("Insufficient funds");
            }

            // Update balances atomically
            console.log("⬇Deducting from sender...");
            const senderResult = await users.updateOne(
                { accountNumber: transfer.from },
                { $inc: { balance: -transfer.amount } },
                { session }
            );
            console.log("Sender update result:", senderResult);
            
            console.log("⬆Adding to receiver...");
            const receiverResult = await users.updateOne(
                { accountNumber: transfer.to },
                { $inc: { balance: transfer.amount } },
                { session }
            );
            console.log("Receiver update result:", receiverResult);

            // Update transfer status to approved
            console.log("Updating transfer status to approved...");
            const transferUpdate = await transfers.updateOne(
                { _id: new ObjectId(transferId) },
                { 
                    $set: { 
                        status: "approved",
                        approvedAt: new Date(),
                        approvedBy: req.user.name
                    } 
                },
                { session }
            );
            console.log("Transfer update result:", transferUpdate);
            
            console.log("🎉 Transfer approved successfully!");
        });

        res.status(200).json({ 
            message: "Transfer approved successfully"
        });

    } catch (error) {
        console.error("Transfer approval error:", error);
        
        if (!res.headersSent) {
            if (error.message === "Insufficient funds") {
                res.status(400).json({ message: "Insufficient funds" });
            } else if (error.message.includes("not found")) {
                res.status(404).json({ message: error.message });
            } else if (error.message.includes("already processed")) {
                res.status(409).json({ message: error.message });
            } else {
                res.status(500).json({ message: "Transfer approval failed: " + error.message });
            }
        }
    } finally {
        await session.endSession();
    }
});

router.post("/reject-transfer", checkauth, async (req, res) => {
    console.log("=== REJECT TRANSFER REQUEST ===");
    console.log("User:", req.user);
    console.log("Body:", req.body);
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    const { transferId, reason } = req.body;
    
    if (!transferId) {
        return res.status(400).json({ message: "Transfer ID is required" });
    }

    try {
        const transfers = db.collection("transfers");
        
        console.log("Looking for transfer to reject:", transferId);
        
        const result = await transfers.updateOne(
            { _id: new ObjectId(transferId), status: "pending" },
            { 
                $set: { 
                    status: "rejected",
                    rejectedAt: new Date(),
                    rejectedBy: req.user.name,
                    rejectionReason: reason || "No reason provided"
                } 
            }
        );

        console.log("Update result:", result);
        
        if (result.modifiedCount === 0) {
            console.log("No transfer found or already processed");
            return res.status(404).json({ message: "Transfer not found or already processed" });
        }

        console.log("Transfer rejected successfully!");
        
        res.status(200).json({ 
            message: "Transfer rejected successfully"
        });

    } catch (error) {
        console.error("Transfer rejection error:", error);
        res.status(500).json({ message: "Transfer rejection failed: " + error.message });
    }
});

router.get("/pending-transfers", checkauth, async (req, res) => {
    // Verify admin role
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    try {
        const transfers = db.collection("transfers");
        
       
        const allTransfers = await transfers
            .find({ status: "pending" }) // Only get pending transfers
            .sort({ date: -1 })
            .limit(100)
            .toArray();
        
        res.status(200).json({ transfers: allTransfers });
    } catch (error) {
        console.error("Error fetching pending transfers:", error);
        res.status(500).json({ message: "Could not fetch pending transfers" });
    }
});



router.get("/users", checkauth, async (req, res) => {
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