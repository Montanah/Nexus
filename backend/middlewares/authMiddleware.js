const jwt = require("jsonwebtoken");
const Client = require("../models/Client");

exports.authenticateClient = async (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        const client = await Client.findById(decoded.id);
        if (!client) {
            return res.status(401).json({ message: "Invalid token" });
        }

        req.user = client;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized" });
    }
};
