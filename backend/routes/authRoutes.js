const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");
const { authenticateClient } = require("../middlewares/authMiddleware");
const { getOAuthRedirectUrl } = require('../controllers/Passport');

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


// Facebook OAuth routes

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
 * /api/auth/loginUser:
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

/**
 * @swagger
 * /api/auth/user/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.put("/user/:id", authenticateClient, authController.updateUserProfile);

/**
 * @swagger
 * /api/auth/restore-session:
 *   get:
 *     summary: Restore user session
 *     tags: [Users]
 *     description: Checks for a valid OAuth token and restores the session if authenticated.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   example: { id: "12345", email: "user@example.com" }
 *       401:
 *         description: Invalid or expired session
 */

router.get('/restore-session', authController.restoreSession);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Auth]
 *     description: Generates a new access token using a valid refresh token (typically from cookies).
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/get-user-id:
 *   get:
 *     summary: Get user ID from cookie
 *     tags: [Users]
 *     description: Returns the user ID extracted from a session cookie.
 *     responses:
 *       200:
 *         description: Successfully retrieved user ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   example: 687a32d10d596217e3043d46
 *       401:
 *         description: Unauthorized or missing cookie
 */
router.get('/get-user-id', authController.getUserIdFromCookie);

/**
 * @swagger
 * /api/auth/verify-social:
 *   post:
 *     summary: Verify a social-authenticated user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               provider:
 *                 type: string
 *                 example: google
 *     responses:
 *       200:
 *         description: Social user verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/verify-social', authController.verifySocialUser);

// === GOOGLE LOGIN ROUTES (for existing users) ===
/**
 * @swagger
 * /api/auth/google/login/initiate:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [OAuth]
 *     description: Generates and returns a redirect URL to begin the Google OAuth login flow.
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional state parameter to maintain app-specific context
 *     responses:
 *       200:
 *         description: Successfully generated redirect URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://accounts.google.com/o/oauth2/v2/auth?...
 */
router.get('/google/login/initiate', (req, res) => {
  const state = req.query.state || '';
  console.log('Initiate Google login with state:', state);
  const redirectUrl = getOAuthRedirectUrl('google', 'login', state);
  console.log('Generated redirect URL:', redirectUrl);
  res.json({ url: redirectUrl });
});

/**
 * @swagger
 * /api/auth/google/login/callback:
 *   get:
 *     summary: Google OAuth login callback
 *     tags: [OAuth]
 *     description: Handles the OAuth callback from Google after user login and returns user session info.
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   example: { id: "12345", email: "user@example.com" }
 *       302:
 *         description: Redirects to frontend with error message if login fails
 */
router.get('/google/login/callback', 
  passport.authenticate('google-login', { 
    session: false, 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed` 
  }), 
  authController.socialLogin
);

// === GOOGLE SIGNUP ROUTES (for new users) ===
/**
 * @swagger
 * /api/auth/google/signup/initiate:
 *   get:
 *     summary: Initiate Google OAuth signup
 *     tags: [OAuth]
 *     description: Returns the redirect URL to initiate Google signup via OAuth.
 *     responses:
 *       200:
 *         description: Redirect URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://accounts.google.com/o/oauth2/v2/auth?...
 */
router.get('/google/signup/initiate', (req, res) => {
  const redirectUrl = getOAuthRedirectUrl('google', 'signup');
  console.log('Google signup redirect URL:', redirectUrl);
  res.json({ url: redirectUrl });
});

/**
 * @swagger
 * /api/auth/google/signup/callback:
 *   get:
 *     summary: Google OAuth signup callback
 *     tags: [OAuth]
 *     description: Callback endpoint for Google signup. Processes the OAuth response and registers the user.
 *     responses:
 *       200:
 *         description: Signup successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   example: { id: "12345", email: "user@example.com" }
 *       302:
 *         description: Redirects to frontend with error if signup fails
 */
router.get('/google/signup/callback', 
  passport.authenticate('google-signup', { 
    session: false, 
    failureRedirect: `${process.env.FRONTEND_URL}/signup?error=google_signup_failed` 
  }), 
  authController.socialSignup
);

// === APPLE LOGIN ROUTES (for existing users) ===
router.get('/apple/login/initiate', (req, res) => {
  const state = req.query.state || '';
  const redirectUrl = getOAuthRedirectUrl('apple', 'login', state);
  res.json({ url: redirectUrl });
});

router.get('/apple/callback', 
  passport.authenticate('apple-login', { 
    session: false, 
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=apple_auth_failed` 
  }), 
  authController.socialLogin
);

// === APPLE SIGNUP ROUTES (for new users) ===
router.get('/apple/signup/initiate', (req, res) => {
  const redirectUrl = getOAuthRedirectUrl('apple', 'signup');
  console.log('Apple signup redirect URL:', redirectUrl);
  res.json({ url: redirectUrl });
});

router.post('/apple/signup/callback', // Apple uses POST
  passport.authenticate('apple-signup', { 
    session: false, 
    failureRedirect: `${process.env.FRONTEND_URL}/signup?error=apple_signup_failed` 
  }), 
  authController.socialSignup
);

// Legacy routes (for backward compatibility)
/**
 * @swagger
 * /api/auth/{provider}/initiate:
 *   get:
 *     summary: Initiate OAuth login
 *     tags: [OAuth]
 *     description: Returns the redirect URL for logging in via a supported OAuth provider (e.g., Google, Facebook).
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth provider name (e.g., google, facebook)
 *     responses:
 *       200:
 *         description: Redirect URL returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: https://accounts.google.com/o/oauth2/v2/auth?...
 */
router.get('/:provider/initiate', (req, res) => {
  const provider = req.params.provider;
  const redirectUrl = getOAuthRedirectUrl(provider, 'login');
  console.log(`${provider} redirect URL:`, redirectUrl);
  res.json({ url: redirectUrl });
});

module.exports = router;