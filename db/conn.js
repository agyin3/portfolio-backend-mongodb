const { MongoClient } = require("mongodb");
const connectionString = process.env.ATLAS_URI;
const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

let dbConnection;

module.exports = {
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

    getDb: function () {
        return dbConnection;
    },
};