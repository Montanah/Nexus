const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema({
    payment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Payment", 
        required: true 
    },
    raisedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    against: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    reason: { 
        type: String, 
        required: true,
        enum: ["item_damaged", "not_delivered", "wrong_item", "late_delivery"] 
    },
    evidence: [String],
    status: { 
        type: String, 
        enum: ["open", "under_review", "resolved", "rejected"], 
        default: "open" 
    },
    resolution: {
        type: {
            action: {
                type: String,
                enum: ["full_refund", "partial_refund", "redelivery", "release_funds"]
            },
            amount: Number,
            notes: String
        }
    }
}, { timestamps: true });

module.exports = mongoose.model("Dispute", disputeSchema);
