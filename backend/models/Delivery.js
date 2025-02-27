const mongoose = require("mongoose");

const DeliverySchema = new mongoose.Schema({
    traveler: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users",
        required: true
    },
    client:  {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users",
        required: true
    },
    product: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
    },
    status: {
        type: String,
        enum: ["pending", "collected", "in_transit", "arrived", "delivered"], 
        default: "pending" 
    },
    proofOfDelivery: { 
        type: String 
    }, // URL to proof (photo/signature)
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model("Delivery", DeliverySchema)