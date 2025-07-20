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
    },
    productAmount: { 
        type: Number, 
        required: true 
    }, // Product Fee
    markupAmount: { 
        type: Number, 
        required: true 
    }, // 15% Markup
    paymentMethod: { 
        type: String, 
        enum: ["Mpesa", "Airtel", "Stripe", "Paystack"], 
        required: true 
    },
    commission: { 
        type: Number, 
        required: true 
    },
    companyfee: { 
        type: Number, 
        required: true 
    },
}, { timestamps: true });

module.exports = mongoose.model("Payment", PaymentSchema);
