const { MongoClient } = require("mongodb");
const connectionString = process.env.ATLAS_URI;
const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
    /*
    @notice - function to connect server to the database
    @param callback - callback function to run once the connection has been made
    @return - callback function is called
    */
    connectToServer: function (callback) {
        client.connect(function (err, db) {
            if (err || !db) {
                return callback(err);
            }

            dbConnection = db.db(process.env.MONDO_DB_NAME);

            console.log("Connected to mongodb!");

            return callback();
        });
    },

    /*
    @notice - funciton to get the database connection
    @returns - dbConnection global variable
    */
    getDb: function () {
        return dbConnection;
    },
};
