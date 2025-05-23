const mongoose = require("mongoose");

const travelerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,  
        ref: "Users",
        required: true  
    },
    earnings: {  
        totalEarnings: { type: Number, default: 0 },
        pendingPayments: { type: Number, default: 0 },
        rating: {
            average: { type: Number, default: 0 },
            count: { type: Number, default: 0 }
            }
    },
    history: [{  
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        rewardAmount: { type: Number },
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