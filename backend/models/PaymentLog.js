// models/PaymentLog.js
const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
  orderNumber: { type: String, required: true },
  paymentLogsId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
 },
  paymentMethod: {
    type: String,
    enum: ["Mpesa", "Airtel", "Stripe", "Paystack"],
    required: true,
  },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Failed"],
    default: "Pending",
  },
  rawResponse: { type: Object }, 
}, { timestamps: true });

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
