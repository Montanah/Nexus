const Client = require("../models/Client");
const Users = require("../models/Users");
const Traveler = require("../models/Traveler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

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
        console.log(user);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
};

//register a new user
exports.createUser = async (req, res) => {
    const { name, email, phone_number, password } = req.body;
    try {
        let user;
        user = new Users({ name, email, phone_number, password });
        await user.save();
        console.log(user);
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error registering user", error });
    }
};

//enable 2FA
exports.enable2FA = async (req, res) => {
    const { id } = req.params;

    try {
        let user = await Client.findById(id);
        if (!user) {
            user = await Traveler.findById(id); 
        }
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate a TOTP secret
        const secret = speakeasy.generateSecret({ name: `MyApp (${user.email})` });
        user.secret2FA = secret.base32; 
        user.is2FAEnabled = true;
        await user.save();

        // Generate a QR Code for Google Authenticator
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            message: "2FA enabled successfully",
            secret: secret.base32,
            qrCodeUrl,
        });
    } catch (error) {
        res.status(500).json({ message: "Error enabling 2FA", error });
    }
};


/**
 * Verify a 2FA token for a user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {string} id - The ID of the user to verify
 * @param {string} token - The 2FA token to verify
 * @return {Object} The response object
 */
// verify 2FA
exports.verify2FA = async (req, res) => {
    const { id } = req.params;
    const { token } = req.body;

    try {
        let user = await Client.findById(id);
        if (!user) {
            user = await Traveler.findById(id);
        }
        if (!user || !user.is2FAEnabled || !user.secret2FA) {
            return res.status(400).json({ message: "2FA not enabled for this user" });
        }

        // Verify the TOTP code
        const verified = speakeasy.totp.verify({
            secret: user.secret2FA,
            encoding: "base32",
            token,
            window: 1, 
        });

        if (verified) {
            res.status(200).json({ message: "2FA verification successful" });
        } else {
            res.status(400).json({ message: "Invalid 2FA code" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error verifying 2FA", error });
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
  
//Log out user
  exports.logout = async (req, res) => {
    try {
        res.clearCookie("token");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error logging out user", error });
    }
};

//get user details
exports.getUserDetails = async (req, res) => {
    try {
        const user = req.user;
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user details", error });
    }
};