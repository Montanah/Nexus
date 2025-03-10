const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
const { authenticateClient } = require("../middlewares/authMiddleware");
const router = express.Router();

//router.post("/register", authController.register);
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phonenumber: 
 *                 type: string
 *               password:
 *                 type: string 
 *     responses:
 *       200:
 *         description: User registered successfully   
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/register", authController.createUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/logout", authController.logout);

/**
 * @swagger
 * /auth/user/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/user/:id", authenticateClient, authController.getUserDetails);

/**
 * @swagger
 * /auth/enable2FA/{id}:
 *   post:
 *     summary: Enable 2FA for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 2FA enabled successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/enable2FA/:id", authController.enable2FA);

/**
 * @swagger
 * /auth/verify2FA/{id}:
 *   post:
 *     summary: Verify 2FA for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA verified successfully
 *       400:
 *         description: Bad request
 *       500: 
 *         description: Internal server error
 */
router.post("/verify2FA/:id", authController.verify2FA);

// Google OAuth routes
/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Redirect to Google OAuth login page
 *     tags: [OAuth]
 *     responses:
 *       200:
 *         description: Redirects to Google OAuth login page
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [OAuth]
 *     responses:
 *       200:
 *         description: User authenticated successfully via Google
 *       401:
 *         description: Authentication failed 
 *       500:
 *         description: Internal server error
 */
router.get("/google/callback", passport.authenticate("google", { session: false }), authController.socialLogin);

// Facebook OAuth routes
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  authController.socialLogin
);

/**
 * @swagger
 * /auth/apple:
 *   get:
 *     summary: Redirect to Apple OAuth login page
 *     tags: [OAuth]
 *     responses:
 *       200:
 *         description: Redirects to Apple OAuth login page
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get('/apple', passport.authenticate('apple'));

/**
 * @swagger
 * /auth/apple/callback:
 *   get:
 *     summary: Apple OAuth callback
 *     tags: [OAuth]
 *     responses:
 *       200:
 *         description: User authenticated successfully via Apple
 *       401:
 *         description: Authentication failed 
 *       500:
 *         description: Internal server error
 */
router.post('/apple/callback', (req, res, next) => {
  passport.authenticate('apple', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.redirect('/');
    });
  })(req, res, next);
});


/**
 * @swagger
 * /auth/verifyUser:
 *   post:
 *     summary: Verify user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: User verified successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/verifyUser", authController.verifyUser);

/**
 * @swagger
 * /auth/loginUser:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/loginUser", authController.loginUser);

/**
 * @swagger
 * /auth/resendVerificationCode:
 *   post:
 *     summary: Resend verification code
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/resendVerificationCode", authController.resendVerification);

/**
 * @swagger
 *  /auth/forgotPassword:
 *   post:
 *     summary: Forgot Password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/forgotPassword", authController.forgotPassword);

/**
 * @swagger
 *  /auth/resetPassword:
 *   post:
 *     summary: Reset Password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/resetPassword', authController.resetPassword);

/**
 * @swagger
 * /auth/verifyLoginOTP:
 *    post:
 *     summary: Verify Login verification code
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error *  
 */
router.post('/verifyLoginOTP', authController.verifyLoginOTP);


module.exports = router;