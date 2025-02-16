const mongoose = require("mongoose");

const DisputeSchema = new mongoose.Schema({
    payment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Payment", 
        required: true 
    },
    client: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Client", 
        required: true 
    },
    reason: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["open", "resolved", "rejected"], 
        default: "open" 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Dispute", DisputeSchema);
