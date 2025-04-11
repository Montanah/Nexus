const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true },
    orderNumber: {
        type: String,
        required: true, 
        unique: true
    },
    items: [
        {
            product:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product", 
                required: true 
                },
            quantity: { 
                type: Number,
                required: true},
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
        ref: "Users",
    },
    urgencyLevel: {
        type: mongoose.Schema.Types.String,
        ref: "Products"
    },
    clientRating: {
        type: Number,
    },
    travelerRating: {
        type: Number,
    }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
