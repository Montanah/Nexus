const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Can be Client or Traveler
    message: { type: String, required: true },
    type: { type: String, enum: ["claim", "delivery"], required: true },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
