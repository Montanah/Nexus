const express = require("express");
const router = express.Router();
const { authenticateClient } = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController");

// Get user notifications
router.get("/:userId", authenticateClient, notificationController.getUserNotifications);

// Mark notifications as read
router.patch("/:userId/mark-read", authenticateClient, notificationController.markAsRead);

// Get notification counts
router.get("/:userId/count", authenticateClient, notificationController.getNotificationCount);
module.exports = router;
