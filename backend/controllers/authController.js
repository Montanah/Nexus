const Client = require("../models/Client");
const Users = require("../models/Users");
const Traveler = require("../models/Traveler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const twilio = require("twilio");

require('dotenv').config();

// Setup Email Transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  transporter.verify((error, success) => {
    if (error) {
      console.log("Error connecting to email:", error);
    } else {
      console.log("Email server is ready to send messages!");
    }
  });
  

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
        if (user) return res.status(400).json({ message: "User already exists" });

         // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

        user = new Users({ name, email, phone_number, password, verificationCode, verificationCodeExpires, });
        
        await user.save();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Account",
            text: `Your verification code is: ${verificationCode}`,
          };

          await transporter.sendMail(mailOptions);

        //   await twilioClient.messages.create({
        //     body: `Your verification code is: ${verificationCode}`,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: phone_number,
        //   });
       
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error); 
        
        return res.status(500).json({ 
            message: "Error registering user", 
            error: error.message || "An unknown error occurred" 
        });
    }
};

//enable 2FA
exports.enable2FA = async (req, res) => {
    const { id } = req.params;

    try {
        let user = await Users.findById(id);
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
        let user = await Users.findById(id);

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

exports.verifyUser = async (req, res) => {
    const { email, code } = req.body;
  
    try {
      const user = await Users.findOne({ email });
  
      if (!user) return res.status(400).json({ message: "User not found" });
  
      if (user.isVerified) return res.status(400).json({ message: "User already verified" });
  
      if (user.verificationCode !== code || new Date() > user.verificationCodeExpires) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }
  
      // Mark user as verified
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();
  
      res.status(200).json({ message: "Verification successful. You can now log in." });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Verification failed", error });
    }
  };
  
//login a user
exports.login = async (req, res) => {
   
    const { email, password } = req.body;
    try {
        let user;

        user = await Users.findOne({ email })

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (!user.is2FAEnabled) {
            return res.status(400).json({ message: "Please enable 2FA to continue"})
        } 
        

        //Match password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        //generate JWT token
        console.log("JWT_SECRET:", process.env.JWT_SECRET);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in user", error });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await Users.findOne({ email });
  
      if (!user) return res.status(400).json({ message: "User not found" });
  
      if (!user.isVerified) return res.status(403).json({ message: "Account not verified. Check your email/SMS" });
  
      //Match password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid password" });
      }

      //generate JWT token
      console.log("JWT_SECRET:", process.env.JWT_SECRET);
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
      });
      res.status(200).json({ message: "Login successful", token, user});
  
    } catch (error) {
      res.status(500).json({ message: "Login error", error });
    }
  };

  exports.resendVerification = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await Users.findOne({ email });
  
      if (!user) return res.status(400).json({ message: "User not found" });
  
      if (user.isVerified) return res.status(400).json({ message: "User already verified" });
  
      // Generate new code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();
  
      // Send Email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "New Verification Code",
        text: `Your new verification code is: ${verificationCode}`,
      });
  
      res.status(200).json({ message: "New code sent. Check your email" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error resending code", error });
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
        const user = await Users.findById(req.params.id).select("-password"); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user details", error });
    }
};