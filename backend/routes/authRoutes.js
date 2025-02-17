const express = require("express");
const passport = require("passport");
const authController = require("../controllers/authController");

const router = express.Router();

//router.post("/register", authController.register);
router.post("/register", authController.createUser);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/user/:id", authController.getUserDetails);

router.post("/enable2FA/:id", authController.enable2FA);
router.post("/verify2FA/:id", authController.verify2FA);

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  authController.socialLogin
);

// Facebook OAuth routes
router.get("/facebook", passport.authenticate("facebook", { scope: ["email"] }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false }),
  authController.socialLogin
);

module.exports = router;