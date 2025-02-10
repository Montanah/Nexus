const Client = require("../models/Client");
const Traveler = require("../models/Traveler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//register a new user
exports.register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        let user;
        if (role === "client") {
            user = new Client({ name, email, password });
        } else if (role === "traveler") {
            user = new Traveler({ name, email, password });
        } else {
            return res.status(400).json({ message: "Invalid role" });
        }
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
};

//login a user
exports.login = async (req, res) => {
    const { email, password, role } = req.body;
    try {
        let user;
        if (role === "client") {
            user = await Client.findOne({ email });
        } else if (role === "traveler") {
            user = await Traveler.findOne({ email });
        } else {
            return res.status(400).json({ message: "Invalid role" });
        }
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        //Match password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        //generate JWT token
        console.log("JWT_SECRET:", process.env.JWT_SECRET);
        const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in user", error });
    }
};

/**
 * Social login handler
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
exports.socialLogin = (req, res) => {
    const user = req.user;
  
    // Generate JWT token
    // We use the user's ID and role in the payload,
    // and sign it with the JWT secret
    // The token will expire after 1 hour
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  
    // Return the JWT token in the response
    res.status(200).json({ message: "Login successful", token });
  };
  