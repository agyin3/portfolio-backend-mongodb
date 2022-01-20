require("dotenv").config();
const express = require("express");
const cors = require("cors");

const Router = require("./routes/index.js");

const db = require("./db/conn.js");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
    res.send("IT IS ALIVE!!!");
});
app.use("/", Router);

// Global error handling
app.use(function (err, _req, res) {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

// perform a database connection when the server starts
db.connectToServer(function (err) {
    if (err) {
        console.error(err);
        process.exit();
    }

    // start the Express server
    app.listen(PORT, () => {
        console.log(`Server is running on port: ${PORT}`);
    });
});
