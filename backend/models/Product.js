const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const productSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
    },
    productName: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    productDescription: {
        type: String,
        required: true,
    },
    productCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    categoryName:{
        type: String,
        required: true
    },
    productWeight: {
        type: Number,
        optional: true,
    },
    productDimensions: {
        type: String,
        optional: true,
    },
    productPhotos: [{
        type: String,
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
        town: {
            type: String,
            required: true,
        },
    },
    deliverydate: {
        type: Date,
        required: true,
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
        default: function () {
            return this.productFee * 0.15;
        }
    },
    totalPrice: {
        type: Number,
        default: function () {
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

productSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Product", productSchema);
