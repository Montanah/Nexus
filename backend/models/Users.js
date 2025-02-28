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
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date, 
        default: Date.now,
    },
});

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