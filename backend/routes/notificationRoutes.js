const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Get all notifications for a user
router.get("/:userId", async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Error fetching notifications", error });
    }
});

// Mark a notification as read
router.put("/:id/read", async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
        res.status(200).json({ message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Error updating notification", error });
    }
});

module.exports = router;
