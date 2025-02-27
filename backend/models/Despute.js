const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema({
    orderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Order", 
        required: true },
    clientId: { 
        type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    travelerId: { type: mongoose.Schema.Types.ObjectId, ref: "Traveler", required: true },
    reason: { type: String, required: true }, // E.g., "Item damaged", "Delayed delivery"
    evidence: [String], // Array of image URLs (proofs)
    status: { 
        type: String, 
        enum: ["pending", "under_review", "resolved", "rejected"], 
        default: "pending" 
    },
    resolution: { type: String, default: null }, // E.g., "Partial refund", "Re-delivery"
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Dispute", disputeSchema);
