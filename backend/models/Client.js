const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "client",
    },
    is2FAEnabled: {
        type: Boolean,
        default: false,
    },
    secret2FA: {
        type: String,
        default: null,
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
clientSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//compare passwords
clientSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model("Client", clientSchema);