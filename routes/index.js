const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const { ObjectId } = require("mongodb");
const cloudinary = require("../config/cloudinaryConfig.js");
const multer = require("../config/multer.js");
const cloudinaryConfig = cloudinary.cloudinaryConfig;
const uploader = cloudinary.uploader;
const multerUploads = multer.multerUploads;
const dataUri = multer.dataUri;

const router = express.Router();

const db = require("../db/conn.js");

/*
@notice - route used to login to admin portal
*/

router.post("/login", async (req, res) => {
    const dbConnection = db.getDb();
    const { username, password } = req.body;

    try {
        const user = await dbConnection
            .collection("users")
            .findOne({ username });

        if (user && bcrypt.compareSync(password, user.password)) {
            const token = generateToken(user);
            res.status(200).json({ token });
        } else {
            throw CustomException(
                "User Exception",
                "There was a problem logging in"
            );
        }
    } catch (error) {
        res.status(500).json({ error });
    }
});

/*
@notice - route to get all projects in database
@return - returns an array of all projects in the database
*/
router.get("/projects", async (req, res) => {
    const dbConnection = db.getDb();

    try {
        const projects = await dbConnection
            .collection("projects")
            .find({})
            .toArray();

        res.status(200).json({ projects });
    } catch (error) {
        res.status(500).json({ error });
    }
});

/*
@notice - route to get a single project by id
*/
router.get("/projects/:id", authenticate, async (req, res) => {
    const dbConnection = db.getDb();
    const { id } = req.params;

    try {
        const project = await dbConnection
            .collection("projects")
            .findOne({ _id: ObjectId(id) });
        if (!project)
            throw CustomException(
                "Query Exception",
                "No project with the given ID found."
            );
        res.status(200).json({ project });
    } catch (error) {
        res.status(500).json({ error });
    }
});

/*
@notice - route to insert project into database
*/
/***** TODO - Add in a schema validator *****/
router.post("/projects", authenticate, async (req, res) => {
    const dbConnection = db.getDb();
    const { name, url, description, languages, github } = req.body;
    const projectDocument = {
        name,
        url,
        description,
        languages,
        github,
        favorite: false,
        image: null,
    };

    try {
        const projectId = await dbConnection
            .collection("projects")
            .insertOne(projectDocument);

        const project = await dbConnection
            .collection("projects")
            .findOne({ _id: projectId.insertedId });

        if (!project)
            throw CustomException("There was a problem uploading your project");

        res.status(201).json({
            message: "Project successfully uploaded",
            project,
        });
    } catch (error) {
        res.status(500).json({ error });
    }
});

/*
@notice - route to upload image to cloudinary and store the url in the database
@param id - passed in as a url param project id
@param image-raw - Image that you want to upload. Image must be passed in as form data
@return - will return success message and document object
*/
router.post(
    "/projects/:id/image",
    authenticate,
    multerUploads.single("image-raw"),
    cloudinaryConfig,
    (req, res) => {
        const dbConnection = db.getDb();
        const { id } = req.params;
        const file = dataUri(req);

        uploader.upload(
            file.content,
            {
                dpr: "auto",
                responsive: true,
                width: "auto",
                crop: "scale",
            },
            async (error, result) => {
                try {
                    const project = await dbConnection
                        .collection("projects")
                        .findOneAndUpdate(
                            { _id: ObjectId(id) },
                            { $set: { image: result.secure_url } }
                        );

                    if (!project)
                        throw CustomException(
                            "Upload Exception",
                            "There was a problem uploading the image"
                        );

                    res.status(200).json({
                        message: "Project successfully uploaded",
                        project: project.value,
                    });
                } catch (error) {
                    res.status(500).json({ error });
                }
            }
        );
    }
);

/*
@notice - route to update project document
@param id - project id passed in as a url param
@return - will return success message and document object
*/
router.put("/projects/:id", authenticate, async (req, res) => {
    const dbConnection = db.getDb();
    const { id } = req.params;

    try {
        const project = await dbConnection
            .collection("projects")
            .findOneAndUpdate({ _id: ObjectId(id) }, { $set: req.body });

        if (!project)
            throw ("Upload Exception", "Problem updating the document");

        res.status(200).json({
            message: "Project successfully uploaded",
            project: project.value,
        });
    } catch (error) {
        res.status(500).json({ error });
    }
});

/*
@notice - route to delete a project document
@param id - project id. must be passed in as a url parameter
*/
router.delete("/projects/:id", authenticate, async (req, res) => {
    const dbConnection = db.getDb();
    const { id } = req.params;

    try {
        const project = await dbConnection
            .collection("projects")
            .deleteOne({ _id: ObjectId(id) });

        if (!project.deletedCount)
            throw CustomException(
                "Database Exception",
                "Invalid project id provided."
            );

        res.status(200).json({ message: "Project successfully deleted" });
    } catch (error) {
        res.status(500).json(error);
    }
});

/*
@notice - function to generate a jwt token
@param user - user object 
@returns - jwt token
*/
function generateToken(user) {
    const payload = {
        subject: user.id,
        username: user.username,
    };

    const options = {
        expiresIn: "1h",
    };

    return jwt.sign(payload, process.env.JWTSECRET, options);
}

/*
@notice - middleware function to decode and authenticate jwt token
@dev - This function will send an error response to client upon unsuccesful token decoding
@param req - HTTP request object
@param res - HTTP response object
@param next - Express middleware to call next function in stack
*/
function authenticate(req, res, next) {
    const token = req.headers.authorization;

    if (res.locals.decodedJWT) {
        next();
    } else if (token) {
        jwt.verify(token, process.env.JWTSECRET, (err, decodedJWT) => {
            if (err) {
                res.status(404).json({ errorMessage: `You shall not pass` });
            } else {
                res.locals.decodedJWT = decodedJWT;
                next();
            }
        });
    } else {
        res.status(401).json({ you: "can't touch that." });
    }
}

/*
@notice - function to handle custom User Exception errors
@param message - error exception message 
@param type - type of exception (ex: "User Exception")
@returns - object containing a exception name and message
*/
function CustomException(type, message) {
    return {
        type,
        message,
    };
}

module.exports = router;
