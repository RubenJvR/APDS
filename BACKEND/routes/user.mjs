import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";


const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);
router.post("/signup", async (req, res) => {
    const { name, password } = req.body;
    if (!name || !password) {
        return res.status(400).json({ message: "Name and password are required." });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        let newDocument = {
            name: name,
            password: hashedPassword
        };
        let collection = await db.collection("users");
        let result = await collection.insertOne(newDocument);
        res.status(201).json(result);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Signup failed." });
    }
});

router.post("/login", bruteforce.prevent, async (req, res)=>{
    const {name, password} = req.body;
    console.log(name + " " + password)

    try{
        const collection = await db.collection("users")
        const user = await collection.findOne({name});

        if (!user){
            return res.status(401).json({ message: "Authentication failed"});
        }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if(!passwordMatch){
        return res.status(401).json({ message: "Authentication failed"});
    }
    else{
        const token = jwt.sign({ username:req.body.username,password:req.body.password}, "this_secret_should_be_longer_than_it_is",{expiresIn: "1h"})
        res.status(200).json({message: "Authentication successful", token: token, name: req.body.name});
        console.log("your new token is", token)
    }
    

    }catch(error){
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed"});
    }

})

export default router