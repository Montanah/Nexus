const Users = require("../models/Users");
const Notification = require("../models/Notification");
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
const redisClient = require("../middlewares/redisClient");
const { sendEmailNew, sendTemplatedEmail } = require("../utils/emailService");
const cookie = require('cookie');
const { exchangeCodeForProfile } = require("../controllers/Passport");

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

        // // Send welcome email with verification
        // const emailResult = await sendTemplatedEmail(
        //     email,
        //     "welcomeUser",
        //     { userName: name, verificationCode }
        // );

        // // Create welcome notification
        // await Notification.create({
        //     recipient: user._id,
        //     type: "welcome",
        //     title: "Welcome to NEXUS!",
        //     message: "Thank you for joining. Verify your email to get started.",
        //     metadata: {
        //         verificationRequired: true
        //     }
        // });

        return response(res, 201, {
            message: "User registered successfully", "user": {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                avatar: user.avatar,
                phone_number: user.phone_number
            },
             
        });
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
            return res.status(400).json({ message: "Please enable 2FA to continue" })
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
        res.status(200).json({ message: "Login successful", token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in user", error });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Users.findOne({ email });

        if (!user) return response(res, 400, "User not found");
        console.log(user.isVerified)
        if (!user.isVerified) return response(res, 403, "Account not verified. Check your email/SMS");

        //if (!user.is2FAEnabled) return response(res, 400, "Please enable 2FA to continue"); // { return res.status(400).json({ message: "Please enable 2FA to continue"})      } 

        //Match password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return response(res, 401, "Invalid password"); // res.status(401).json({ message: "Invalid password" });
        }

        // Generate OTP for login verification
        const verificationCode = generateOTP();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Save OTP and expiry in the database
        user.loginVerificationCode = verificationCode;
        user.loginVerificationCodeExpires = verificationCodeExpires;
        await user.save();

        const userId = user._id;
        // Generate tokens
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        // Store tokens in Redis
        await redisClient.set(`authToken:${userId}`, accessToken, { EX: 15 * 60 });
        await redisClient.set(`refreshToken:${userId}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

        // Send OTP via email
        sendEmail(email, "Login Verification Code", `Your login verification code is: ${verificationCode}`);


        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return response(res, 200, {
            message: "Verification code sent to your email.",
            userId: user._id
        });

    } catch (error) {
        response(res, 500, { message: "Login error", error: error.message });
    }
};

exports.verifyLoginOTP = async (req, res) => {
    const { userId, verificationCode } = req.body;

    try {
        const user = await Users.findById(userId);

        if (!user) return response(res, 400, "User not found");

        // Check if OTP is valid and not expired
        if (
            !user.loginVerificationCode ||
            user.loginVerificationCode !== verificationCode ||
            new Date() > user.loginVerificationCodeExpires
        ) {
            return response(res, 400, "Invalid or expired verification code");
        }

        // Clear the OTP fields after successful verification
        user.loginVerificationCode = undefined;
        user.loginVerificationCodeExpires = undefined;
        await user.save();

        // Generate JWT token
        // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        //     expiresIn: "1h",
        // });
        // Generate tokens
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        // Store tokens in Redis
        await redisClient.set(`authToken:${userId}`, accessToken, { EX: 15 * 60 });
        await redisClient.set(`refreshToken:${userId}`, refreshToken, { EX: 7 * 24 * 60 * 60 });
    
        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log('Setting cookies:', { accessToken, refreshToken })
        return response(res, 200, {
            message: "Login successful",
            token: accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                avatar: user.avatar
            }
        });

    } catch (error) {
        response(res, 500, { message: "OTP verification error", error: error.message });
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
exports.socialLogin = async (req, res) => {
  try {
    const userProfile = req.user;
    const state = req.query.state || '';
    console.log('socialLogin userProfile:', userProfile, 'state:', state);

    const existingUser = await Users.findOne({ email: userProfile.email });
    console.log('existingUser:', existingUser);

    if (!existingUser) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/signup?error=no_account&message=${encodeURIComponent('No account found. Please sign up.')}&state=${encodeURIComponent(state)}`
      );
    }

    if (existingUser.isVerified === false) {
      const verificationCode = generateOTP();
      await sendEmail(userProfile.email, 'Verify Your Login', `Your verification code is: ${verificationCode}`);
      
      existingUser.verificationCode = verificationCode;
      existingUser.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
      await existingUser.save();

      return res.redirect(
        `${process.env.FRONTEND_URL}/login?provider=${userProfile.provider}&email=${encodeURIComponent(userProfile.email)}&requiresVerification=true&state=${encodeURIComponent(state)}`
      );
    }

    const userId = existingUser._id;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    await redisClient.set(`authToken:${userId}`, accessToken, { EX: 15 * 60 });
    await redisClient.set(`refreshToken:${userId}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/login?provider=${userProfile.provider}&email=${encodeURIComponent(userProfile.email)}&requiresVerification=false&token=${accessToken}&state=${encodeURIComponent(state)}`
    );
  } catch (err) {
    console.error('OAuth login error:', err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=login_failed&message=${encodeURIComponent(err.message)}&state=${encodeURIComponent(state)}`
    );
  }
};

//Log out user
exports.logout = async (req, res) => {
    try {
        let token = req.header("Authorization")?.replace("Bearer ", ""); // Use 'let' instead of 'const'
        if (!token) {
            token = req.cookies.accessToken; // Reassignment now valid
        }
        if (!token) {
            return res.status(400).json({ message: "No token provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                decoded = jwt.decode(token);
            } else {
                throw error;
            }
        }

        if (!decoded?.id) {
            return response(res, 400, {
                message: "Invalid token",
                code: "INVALID_TOKEN"
            });
        }

        await Promise.all([
            redisClient.del(`authToken:${decoded.id}`),
            redisClient.del(`refreshToken:${decoded.id}`)
        ]);

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });

        return response(res, 200, {
            message: "Logged out successfully",
            code: "LOGOUT_SUCCESS"
        });
    } catch (error) {
        console.error("Logout error:", error);
        return response(res, 500, {
            message: "Error logging out user",
            error: error.message,
            code: "LOGOUT_ERROR"
        });
    }
};


//get user details
exports.getUserDetails = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id).select("-password");
        if (!user) {
            return response(res, 404, "User not found");
        }

        return response(res, 200, {
            message: "Login successful", "user": {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                avatar: user.avatar,
                phone_number: user.phone_number
            }
        });
    } catch (error) {
        response(res, 500, "Error fetching user details", error);
    };
}

//forget password
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Users.findOne({ email });

        if (!user) return response(res, 400, "User not found");

        // Generate new code
        const resetToken = generateOTP();
        //const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

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
        console.error("Error in reset password:", error);
        response(res, 500, {
            message: "Error processing reset password request",
            error: error.message || "An unknown error occurred"
        });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { name, email, phone_number, avatar } = req.body;

        const user = await Users.findById(req.params.id);
        if (!user) {
            return response(res, 404, "User not found");
        }
        user.name = name || user.name;
        user.email = email || user.email;
        user.phone_number = phone_number || user.phone_number;
        user.avatar = avatar || user.avatar;

        await user.save();

        return response(res, 200, {
            "message": "User updated successfully", "user": {
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified,
                avatar: user.avatar,
                phone_number: user.phone_number
            }
        });
    } catch (error) {
        return response(res, 500, { "message": "Error updating user", "error": error });
    }
}

exports.restoreSession = async (req, res) => {

    const { userId } = req.query;

    if (!userId) {
        return response(res, 400, "User Id not provided");
    }

    try {
        const token = await redisClient.get(`authToken:${userId}`); // Get token from Redis
        if (!token) return response(res, 401, "Session expired");

        const newToken = generateAccessToken(userId);

        await redisClient.set(`authToken:${userId}`, newToken, { EX: 3600 }); // Set new token in Redis

        res.json({ token });
        // return response(res, 200, { "message": "User session restored", "token": token });
    } catch (error) {
        console.error("Error restoring user session:", error);
        return response(res, 500, { "message": "Error restoring user session", "error": error });
    }
};

exports.refreshToken = async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          status: 401,
          message: 'Refresh token required',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }
  
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      const storedRefresh = await redisClient.get(`refreshToken:${decoded.id}`);
      
      if (refreshToken !== storedRefresh) {
        return res.status(401).json({
          status: 401,
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
  
      const newAccessToken = generateAccessToken(decoded.id);
      await redisClient.set(`authToken:${decoded.id}`, newAccessToken, {
        EX: 900 // 15 minutes
      });
  
      res.cookie('accessToken', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000
      });
  
      return res.json({
        status: 200,
        message: 'Token refreshed',
        accessToken: newAccessToken
      });
    } catch (error) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  };


  function generateAccessToken(userId) {
    return jwt.sign({
        id: userId
    }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '15m'
    });
}
function generateRefreshToken(userId) {
    return jwt.sign({
        id: userId
    }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '7d'
    });
}
exports.getUserIdFromCookie = (req, res) => {
    try {
        const accessToken = req.cookies.accessToken;
        console.log('getUserId: Received accessToken:', accessToken);

        if (!accessToken) {
            return res.status(401).json({ message: 'Access token required' });
        }

        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        console.log('getUserId: Decoded token:', decoded);
        res.json({ data: decoded.id });
  } catch (error) {
    console.error('getUserId error:', error);
    res.status(401).json({ message: 'Invalid access token' });
  }
};

exports.verifySocialUser = async (req, res) => {
  try {
    const { email, code, provider } = req.body;
  
    if(!email || !code || !provider) { 
        return response(res, 400, {
        success: false,
        message: 'Email and verification code are required'
        });
    }
  
    // Find user by email and verification code
    const user = await Users.findOne({ email });
    if (!user) {
      return response(res, 400, {
        success: false,
        message: 'User not found'
      });
    }

    if (user.verificationCode !== code || new Date() > user.verificationCodeExpires) {
      return response(res, 400, {
        success: false,
        message: 'Invalid or expired code'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const userId = user._id;
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    await redisClient.set(`authToken:${user._id}`, accessToken, { EX: 15 * 60 });
    await redisClient.set(`refreshToken:${user._id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    return response(res, 200, {
      success: true,
      message: 'Social account verified successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        avatar: user.avatar,
        phone_number: user.phone_number
      }
    });
  } catch (error) {
    console.error('Social verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying social account',
      error: error.message
    });
  }
};

// GET /auth/oauth/:provider/signup/callback - for new user signup
exports.socialSignup = async (req, res) => {
    try {
        const userProfile = req.user;
        console.log("userProfile from passport:", userProfile);
        
        const existingUser = await Users.findOne({ email: userProfile.email });
        console.log('existingUser:', existingUser);
        if (!existingUser) {
            // New user - requires verification
            const verificationCode = generateOTP();
            
            await sendEmail(userProfile.email, "Verify Your Account", `Your verification code is: ${verificationCode}`);
            
            // Save new user with verification required
            const newUser = await Users.create({
                name: userProfile.name,
                email: userProfile.email,
                provider: userProfile.provider,
                providerId: userProfile.providerId,
                verificationCode,
                requiresVerification: true,
                isVerified: false,
                password: `${userProfile.provider}-auth` // Placeholder password
            });

            // Redirect to frontend with query params
            return res.redirect(
                `${process.env.FRONTEND_URL}/signup?provider=${userProfile.provider}&email=${encodeURIComponent(userProfile.email)}&requiresVerification=true&isNewUser=true`
            );
        }

        if ( existingUser.isVerified === false ) {
            // Send new verification code
            const verificationCode = generateOTP();
            await sendEmail(userProfile.email, "Verify Your Account", `Your verification code is: ${verificationCode}`);
            
            // Update user with new verification code
            existingUser.verificationCode = verificationCode;
            existingUser.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
            await existingUser.save();

            // Redirect to frontend with query params
            return res.redirect(
                `${process.env.FRONTEND_URL}/signup?provider=${userProfile.provider}&email=${encodeURIComponent(userProfile.email)}&requiresVerification=true&isNewUser=true`
            );
        }

        // Existing verified user - direct login
        const userId = existingUser._id;
        const accessToken = generateAccessToken(userId);
        const refreshToken = generateRefreshToken(userId);

        // Store tokens in Redis
        await redisClient.set(`authToken:${userId}`, accessToken, { EX: 15 * 60 });
        await redisClient.set(`refreshToken:${userId}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        console.log('Setting cookies:', { accessToken, refreshToken });
        return res.redirect(
          `${process.env.FRONTEND_URL}/login`
        );
        // return res.status(200).json({
        //     success: true,
        //     data: {
        //         requiresVerification: false,
        //         message: "Login successful",
        //         token: accessToken,
        //         user: {
        //             _id: existingUser._id,
        //             name: existingUser.name,
        //             email: existingUser.email,
        //             isVerified: existingUser.isVerified || existingUser.verified,
        //             avatar: existingUser.avatar
        //         }
        //     }
        // });

    } catch (err) {
        console.error('OAuth signup error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'OAuth signup failed',
            error: err.message 
        });
    }
};

