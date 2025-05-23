const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: v => /^ORD-\d{13}-\d+$/.test(v),
            message: "Invalid order number format"
        }
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
        },
    ],
    totalAmount: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending",
    },
    paymentMethod: {
        type: String,
        enum: ["Mpesa", "Airtel", "Stripe"],
    },
    deliveryStatus: {
        type: String,
        enum: ["Pending", "Assigned", "Shipped", "Delivered", "Cancelled"],
        default: "Pending"
    },
    travelerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Traveler",
    },
    urgencyLevel: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "low"
    },
    clientRating: {
        type: Number,
        min: 1,
        max: 5,
    },
    travelerRating: {
        type: Number,
        min: 1,
        max: 5,
    },
    clientComment: {
        type: String,
        maxlength: 500,
    },
    travelerComment: {
        type: String,
        maxlength: 500,
    },
    deliveryProof: {
        type: String,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
