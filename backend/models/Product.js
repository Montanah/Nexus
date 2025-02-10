const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    productDescription: {
        type: String,
        required: true,
    },
    productCategory: {
        type: String,
        required: true,
    },
    productWeight: {
        type: Number,
        required: true,
    },
    productDimensions: {
        type: String,
        required: true,
    },
    productImage: [{
        type: String,
        required: true,
    }],
    destination: {
        city: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true, 
        },
    },
    shippingRestrictions: {
        type: String,
        default: "",
    },
    productFee: {
        type: Number,
        required: true,
    },
    productMarkup: {
        type: Number,
        default: function() {
            return this.productFee * 0.15;
        }
    },
    totalPrice: {
        type: Number,
        default: function() {
            return this.productFee + this.productMarkup;
        }
    }, 
    urgencyLevel: { 
        type: String, 
        enum: ["low", "medium", "high"], 
        default: "medium" 
    },

    // Traveler
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Traveler",
        default: null
    },
    isDelivered: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
