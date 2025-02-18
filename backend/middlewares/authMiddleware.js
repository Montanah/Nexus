const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

exports.authenticateClient = async (req, res, next) => {
    //const token = req.header("Authorization");
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        //const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        // const client = await Users.findById(decoded.id);
        // if (!client) {
        //     return res.status(401).json({ message: "Invalid token" });
        // }

        // req.user = client;
       
        //const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user to request
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
};
