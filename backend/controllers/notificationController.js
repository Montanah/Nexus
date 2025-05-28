const Notification = require("../models/Notification");
const { response } = require("../utils/responses");
const { sendEmailNew, sendTemplatedEmail } = require("../utils/emailService");

// Create a new notification
exports.createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    
    const user = await Users.findById(data.recipient).select("email notificationPreferences");

    if (user?.notificationPreferences?.email) {
      if (data.type in ['payment_received', 'dipute_opened']) {
        await sendTemplatedEmail(
            user.email,
            data.type,
            {
                amount: data.metadata?.amount,
                transactionId: data.relatedEntity,
                reason: data.metadata?.reason
            }
        );
      } else {
            await sendEmailNew.send(
                user.email,
                notification.title,
                data.message
            );
        }
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1, unreadOnly = false } = req.query;

    const query = { recipient: userId };
    if (unreadOnly) query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("sender", "name avatar")
      .populate("relatedEntity");

    const total = await Notification.countDocuments(query);

    return response(res, 200, {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return response(res, 500, {
      message: "Error fetching notifications",
      error: error.message
    });
  }
};

// Mark notifications as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const { userId } = req.params;

    // Validate ownership
    const notifications = await Notification.find({
      _id: { $in: notificationIds },
      recipient: userId
    });

    if (notifications.length !== notificationIds.length) {
      return response(res, 403, {
        message: "Some notifications don't exist or don't belong to you"
      });
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { $set: { isRead: true } }
    );

    return response(res, 200, {
      message: "Notifications marked as read",
      count: notificationIds.length
    });
  } catch (error) {
    return response(res, 500, {
      message: "Error marking notifications as read",
      error: error.message
    });
  }
};

// Get notification count (for badges)
exports.getNotificationCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    return response(res, 200, {
      unreadCount,
      totalCount: await Notification.countDocuments({ recipient: userId })
    });
  } catch (error) {
    return response(res, 500, {
      message: "Error getting notification count",
      error: error.message
    });
  }
};

// Notification factory helpers
exports.notificationTemplates = {
  paymentReceived: (payment) => ({
    title: "Payment Received",
    message: `Your payment of $${payment.totalAmount} has been received and placed in escrow.`,
    type: "payment_received"
  }),

  escrowReleased: (payment, travelerReward) => ({
    title: "Funds Released",
    message: `Your escrow funds have been released. You received $${travelerReward} as reward.`,
    type: "escrow_released"
  }),

  disputeOpened: (dispute) => ({
    title: "Dispute Opened",
    message: `A dispute has been opened regarding your transaction: ${dispute.reason}`,
    type: "dispute_opened"
  }),

  disputeResolved: (dispute, resolution) => ({
    title: "Dispute Resolved",
    message: `Your dispute has been resolved: ${resolution}`,
    type: "dispute_resolved"
  })
};

