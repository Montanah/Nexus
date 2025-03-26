const mongoose = require("mongoose");

const travelerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,  
        ref: "Users",
        required: true  
    },
    totalEarnings: {
        type: Number,  
        default: 0
    },
    pendingPayments: {
        type: Number,  
        required: true,
        default: 0
    },
    travelerRating: {
        type: Number,
        min: 1,
        max: 5,
        default: 0
    },
    history: [{  
        orderNumber: String,
        rewardAmount: Number,
        status: {
            type: String,
            enum: ["Completed", "Pending"],  
            default: "Pending"
        },
        completedAt: {
            type: Date,
            default: null
        }
    }],
}, { timestamps: true });


module.exports = mongoose.model("Traveler", travelerSchema);