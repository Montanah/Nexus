const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    client: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users", 
        required: true 
    },
    traveler: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Traveler", 
        required: false 
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
    },
    totalAmount: { 
        type: Number, 
        required: true 
    }, // Product Fee + 15% Markup
    status: { 
        type: String, 
        enum: ["escrow", "released", "disputed", "refunded"], 
        default: "escrow" 
    }
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
