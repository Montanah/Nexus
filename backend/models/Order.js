const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^ORD-\d+-\d{4}$/, 'Invalid order number format']
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
            claimedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Traveler",
                default: null
            },
            deliveryStatus: {
                type: String,
                enum: ["Pending", "Assigned", "Shipped", "Delivered", "Cancelled", "client_confirmed", "traveler_confirmed"],
                default: "Pending"
            }
        }
    ],    
    totalAmount: { type: Number, required: true },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Failed"],
        default: "Pending",
    },
    paymentMethod: {
        type: String,
        enum: ["Mpesa", "Airtel", "Stripe", "Paystack"],
    },
    deliveryStatus: {
        type: String,
        enum: ["Pending", "Assigned", "Shipped", "Delivered", "Cancelled", "client_confirmed", "traveler_confirmed"],
        default: "Pending"
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
