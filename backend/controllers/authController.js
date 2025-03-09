const Client = require("../models/Client");
const Users = require("../models/Users");
const Traveler = require("../models/Traveler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");

const crypto = require("crypto");
const twilio = require("twilio");
const { generateOTP } = require("../utils/otp-generator");
const { use } = require("passport");
const { sendEmail } = require("../utils/nodemailer");
const { response } = require("../utils/responses");

require('dotenv').config();



//register a new user
exports.createUser = async (req, res) => {
    const { name, email, phone_number, password } = req.body;
    try {
         // Check if user exists
        let user = await Users.findOne({ email });
        if (user) return response(res, 400, "User already exists");

         // Generate verification code
        //const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
        const verificationCode = generateOTP();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

        user = new Users({ name, email, phone_number, password, verificationCode, verificationCodeExpires, });
        
        await user.save();

        sendEmail(email, "Verify Your Account", `Your verification code is: ${verificationCode}`);
        //   await twilioClient.messages.create({
        //     body: `Your verification code is: ${verificationCode}`,
        //     from: process.env.TWILIO_PHONE_NUMBER,
        //     to: phone_number,
        //   });
        return response(res, 201, { message: "User registered successfully", user});
        //res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Error registering user:", error); 
        
        return response(res, 500, { 
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
  
      if (!user) return response(res, 400, "User not found"); // res.status(400).json({ message: "User not found" });
  
      if (user.isVerified) return response(res, 400, "User already verified"); // res.status(400).json({ message: "User already verified" });
  
      if (user.verificationCode !== code || new Date() > user.verificationCodeExpires) {
        return response(res, 400, "Invalid or expired code"); // res.status(400).json({ message: "Invalid or expired code" });
      }
  
      // Mark user as verified
      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();
  
      response(res, 200, "Verification successful. You can now log in."); // res.status(200).json({ message: "Verification successful. You can now log in." });
  
    } catch (error) {
      console.error(error);
      response(res, 500, "Verification failed", error); // res.status(500).json({ message: "Verification failed", error });
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
  
      if (!user) return response(res, 400, "User not found"); // res.status(400).json({ message: "User not found" });
  
      if (!user.isVerified) return response(res, 403, "Account not verified. Check your email/SMS"); // res.status(403).json({ message: "Account not verified. Check your email/SMS" });
      
      if (!user.is2FAEnabled) return response(res, 400, "Please enable 2FA to continue"); // { return res.status(400).json({ message: "Please enable 2FA to continue"})      } 
      
      //Match password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
          return response(res, 401, "Invalid password"); // res.status(401).json({ message: "Invalid password" });
      }

      //generate JWT token
      console.log("JWT_SECRET:", process.env.JWT_SECRET);
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
      });
      return response(res, 200, {
        message: "Login successful",
        token,
        user: { 
            _id: user._id, 
            name: user.name, 
            email: user.email, 
            isVerified: user.isVerified
        }
    });
      //res.status(200).json({ message: "Login successful", token, user});
  
    } catch (error) {
      response(res, 500, { message: "Login error", error: error.message });
      //res.status(500).json({ message: "Login error", error });
    }
  };

exports.resendVerification = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await Users.findOne({ email });
  
      if (!user) return response(res, 400, "User not found"); // res.status(400).json({ message: "User not found" });
  
      if (user.isVerified) return response(res, 400, "User already verified") // res.status(400).json({ message: "User already verified" });
  
      // Generate new code
      const verificationCode = generateOTP();
      //const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
  
      user.verificationCode = verificationCode;
      user.verificationCodeExpires = verificationCodeExpires;
      await user.save();

      // Send Email  
      sendEmail(email, "New Verification Code", `Your new verification code is: ${verificationCode}`);
    
      response(res, 200, "New code sent. Check your email"); //      res.status(200).json({ message: "New code sent. Check your email" });
  
    } catch (error) {
      console.error(error);
      response(res, 500, "Error resending code", error); // res.status(500).json({ message: "Error resending code", error });
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
    response(res, 200, { message: "Login successful", token }); // res.status(200).json({ message: "Login successful", token });
  };
  
//Log out user
  exports.logout = async (req, res) => {
    try {
        response(res, 200, "Logged out successfully"); // res.clearCookie("token");
        response(res, 200, "Logged out successfully"); // res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        response(res, 500, "Error logging out user", error); // res.status(500).json({ message: "Error logging out user", error });
    }
};

//get user details
exports.getUserDetails = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id).select("-password"); 
        if (!user) {
            return response(res, 404, "User not found"); // res.status(404).json({ message: "User not found" });
        }

        response(res, 200, user); // res.status(200).json(user);
    } catch (error) {
        response(res, 500, "Error fetching user details", error); // res.status(500).json({ message: "Error fetching user details", error });
    }
};

//forget password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      // Check if user exists
      const user = await Users.findOne({ email });
      
      if (!user) return response(res, 400, "User not found"); // res.status(400).json({ message: "User not found" });
  
      // Generate new code
      const resetToken = generateOTP();
      //const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
  
      //save reset token to the database
      user.verificationCode = resetToken;
      user.verificationCodeExpires = resetTokenExpires;
      await user.save();
  
      // Send Email  
      sendEmail(email, "Reset Password", `Your reset code is: ${resetToken}`);

      response(res, 200, "Reset code sent. Check your email");

    } catch (error) {
      console.error(error);
      response(res, 500, { 
        message: "Error processing forgot password request", 
        error: error.message || "An unknown error occurred"
        });
    }
  };

  exports.resetPassword = async (req, res) => {
    const { email, password, resetToken } = req.body;
  
    try {
      // Check if user exists
      const user = await Users.findOne({ email });
  
      if (!user) return response(res, 400, "User not found"); // res.status(400).json({ message: "User not found" });
  
      
      // Check if reset token has expired    
      if (user.resetTokenExpires < Date.now()) return response(res, 400, "Reset token has expired"); // res.status(400).json({ message: "Reset token has expired" });
  
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;

      await user.save();

      return response(res, 200, "Password reset successful"); // res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error in reset password:",error);
      response(res, 500, { 
        message: "Error processing reset password request", 
        error: error.message || "An unknown error occurred"
        });
    }
};