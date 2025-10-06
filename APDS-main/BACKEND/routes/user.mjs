import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
import checkauth from "../check-auth.mjs";


const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);
router.post("/signup", async (req, res) => {
    const { fullName, idNumber, accountNumber, name, password } = req.body;
    if (!fullName || !idNumber || !accountNumber || !name || !password) {
        return res.status(400).json({ message: "All fields are required." });// tiny bit of validation thall need expanding on 
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10); //account details adjusted to meet the poe stuffs
        let newDocument = {
            fullName,
            idNumber,
            accountNumber,
            name,
            password: hashedPassword,
            balance: 0 
        };
        let collection = await db.collection("users");
        let result = await collection.insertOne(newDocument);
        res.status(201).json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Signup failed." });
    }
});

router.post("/login", bruteforce.prevent, async (req, res) => {
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
            const token = jwt.sign(
                { name: user.name, accountNumber: user.accountNumber },
                "this_secret_should_be_longer_than_it_is",
                { expiresIn: "1h" }
            );
            res.status(200).json({
                message: "Authentication successful",
                token: token,
                name: user.name,
                accountNumber: user.accountNumber
            });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
})

router.post("/transfer", checkauth, async (req, res) => {
    const { toAccountNumber, amount } = req.body;
    const fromAccountNumber = req.user.accountNumber;

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

        res.status(200).json({ message: "Transfer successful" });
    } catch (error) {
        console.error("Transfer error:", error);
        res.status(500).json({ message: "Transfer failed" });
    }
});

// added this so a user would be able to add funds to their account without transferring it to themselves or something else dumb
router.post("/add-funds", checkauth, async (req, res) => {
    const { amount } = req.body;
    const accountNumber = req.user.accountNumber;

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

export default router