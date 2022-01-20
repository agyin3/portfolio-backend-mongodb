const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");

const router = express.Router();

const db = require("../db/conn.js");

// Login
router.post("/login", async (req, res) => {
    const dbConnection = db.getDb();
    const { username, password } = req.body;

    try {
        const user = await dbConnection
            .collection("users")
            .findOne({ username });
        console.log(user);
        if (user && bcrypt.compareSync(password, user.password)) {
            const token = generateToken(user);
            res.status(200).json({ token });
        } else {
            throw UserException("There was a problem logging in");
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

// Utility Functions
function generateToken(user) {
    const payload = {
        subject: user.id,
        username: user.username,
    };

    const options = {
        expiresIn: "1000ms",
    };

    return jwt.sign(payload, process.env.JWTSECRET, options);
}
// Error Exceptions
function UserException(message) {
    return {
        name: "User Exception",
        message,
    };
}

module.exports = router;
