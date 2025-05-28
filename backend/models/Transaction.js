const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    payment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Payment", 
        required: true 
    },
    type: {
        type: String,
        enum: ["escrow_deposit", "traveler_reward", "company_fee", "client_refund"],
        required: true
    },
    amount: { 
        type: Number, 
        required: true 
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: { 
        type: String, 
        enum: ["pending", "completed", "failed"], 
        default: "pending" 
    }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", TransactionSchema)