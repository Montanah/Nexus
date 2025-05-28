// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"
  },
  relatedEntity: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'relatedEntityModel'
  },
  relatedEntityModel: {
    type: String,
    required: true,
    enum: ["Payment", "Dispute", "Transaction", "Order"]
  },
  type: {
    type: String,
    required: true,
    enum: [
      "payment_received",
      "escrow_created",
      "escrow_released",
      "dispute_opened",
      "dispute_updated",
      "dispute_resolved",
      "funds_released",
      "refund_processed",
      "system_alert",
      "order_received",
      "order_shipped",
      "welcome",
      "verification_reminder",
      "profile_completion"
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;