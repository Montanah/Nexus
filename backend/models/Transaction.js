const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
    payment: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Payment", 
        required: true 
    },
    travelerReward: { 
        type: Number, 
        required: true 
    }, // 60% of 15% markup
    companyFee: { 
        type: Number, 
        required: true 
    }, // 40% of 15% markup
    status: { 
        type: String, 
        enum: ["completed"], 
        default: "completed" 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
