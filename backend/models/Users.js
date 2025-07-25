const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UsersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone_number: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: null,
    },
    is2FAEnabled: {
        type: Boolean,
        default: false,
    },
    secret2FA: {
        type: String,
        default: null,
    },  
    isVerified: { 
        type: Boolean, 
        default: false
    }, 
    verificationCode: { 
        type: String 
    }, 
    verificationCodeExpires: { 
        type: Date 
    }, 
    loginVerificationCode: {
        type: String,
        default: null,
    },
    loginVerificationCodeExpires: {
        type: String,
        default: null,
    }, 
    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 },
    },
    provider: {
        type: String,
        default: null,
    },
    providerId: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['user', 'client', 'traveler', 'admin', 'superAdmin'],
        default: "user",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date, 
        default: Date.now,
    },
}, { timestamps: true });

// Hash password
UsersSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//compare passwords
UsersSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model("Users", UsersSchema);