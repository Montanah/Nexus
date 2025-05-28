require('dotenv').config();
const axios = require('axios');
const Order = require('../models/Order');
const PaymentLog = require('../models/PaymentLog');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const response = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode,
    description: statusCode === 200 ? 'Success' : 'Error',
    success: statusCode === 200,
    data,
  });
};

if (!PAYSTACK_SECRET_KEY) {
  console.error("❌ Paystack Secret Key is missing!");
  process.exit(1);
}

const  headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json'
};

exports.initializeTransaction = async (req, res) => {
    const { email, amount, userId, orderNumber } = req.body;

    try {
        const paystackResponse = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            { email, amount: parseInt(amount) * 100, metadata: { userId, orderNumber } },
            { headers }
        );

    const checkoutId = paystackResponse.data.data.reference;
    
    //save TransactionDetails
    await PaymentLog.create({
        userId,
        orderNumber,
        paymentLogsId: checkoutId,
        paymentMethod: "Paystack",
        amount,
        status: "Pending",
        rawResponse: paystackResponse.data
    });

    //update Order
    const order = await Order.findOne({ orderNumber });
    if (!order) {
        return response(res, 404, { message: "Order not found" });
    }
    order.paymentStatus = "Pending";
    order.paymentMethod = "Paystack";
    await order.save();

    return response(res, 200, { 
        message: "Transaction initialized successfully",
        authorization_url: paystackResponse.data.data.authorization_url,
        reference: paystackResponse.data.data.reference,  
    });
    } catch (error) {
        console.error("Error during Paystack transaction:", error?.response?.data || error.message);

        return response(res, 500, {
            message: "Error initializing transaction",
            error: error?.response?.data || error.message || "Unknown error"
        });
    }
}

// @desc Verify Paystack payment
exports.verifyTransaction = async (req, res) => {
  const { reference } = req.params;
//   const userId = req.user.id;

  try {
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers }
    );

    const orderNumber = paystackResponse.data.data.metadata.orderNumber;
    //update PaymentLog
    const paymentLog = await PaymentLog.findOne({ paymentLogsId: reference });
    if (!paymentLog) {
        return response(res, 404, { message: "Payment log not found" });
    }
    paymentLog.status = "Paid";
    await paymentLog.save();

    //update Order
    const order = await Order.findOne({ orderNumber });
    if (!order) {
        return response(res, 404, { message: "Order not found" });
    }
    order.paymentStatus = "Paid";
    await order.save();

    return response(res, 200, {
      message: 'Transaction verified successfully',
      success: true,
      status: paystackResponse.data.data.status,
      data: paystackResponse.data.data,
    });
  } catch (err) {
    console.error('Paystack Verify Error:', err.response?.data || err.message);
    return response(res, 500, { 
        message: 'Failed to verify transaction', 
        success: false, error: 'Failed to verify transaction'
    });
  }
};

exports.getTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/${id}`,
      { headers }
    );

    return response(res, 200, {
      message: 'Transaction retrieved successfully',
      success: true,
      status: paystackResponse.data.data.status,
      data: paystackResponse.data.data,
    });
  } catch (err) {
    console.error('Paystack Verify Error:', err.response?.data || err.message);
    return response(res, 500, { 
        message: 'Failed to retrieve transaction', 
        success: false, error: 'Failed to retrieve transaction'
    });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const paystackResponse = await axios.get(
      'https://api.paystack.co/transaction',
      { headers }
    );

    return response(res, 200, {
      message: 'Transactions retrieved successfully',
      success: true,
      status: paystackResponse.data.data.status,
      data: paystackResponse.data.data,
    });
  } catch (err) {
    console.error('Paystack Verify Error:', err.response?.data || err.message);
    return response(res, 500, { 
        message: 'Failed to retrieve transactions', 
        success: false, error: 'Failed to retrieve transactions'
    });
  }
};


exports.getTransactionTimeline = async (req, res) => {
  const { id } = req.params;

  try {
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/timeline/${id}`,
      { headers }
    );

    return response(res, 200, {
      message: 'Transaction timeline retrieved successfully',
      success: true,
      status: paystackResponse.data.data.status,
      data: paystackResponse.data.data,
    });
  } catch (err) {
    console.error('Paystack Verify Error:', err.response?.data || err.message);
    return response(res, 500, { 
        message: 'Failed to retrieve transaction timeline', 
        success: false, error: 'Failed to retrieve transaction timeline'
    });
  }
};

exports.getTransactionsSummary = async (req, res) => {
  try {
    const paystackResponse = await axios.get(
      'https://api.paystack.co/transaction/totals',
      { headers }
    );

    return response(res, 200, {
      message: 'Transactions summary retrieved successfully',
      success: true,
      status: paystackResponse.data.data.status,
      data: paystackResponse.data.data,
    });
  } catch (err) {
    console.error('Paystack Verify Error:', err.response?.data || err.message);
    return response(res, 500, { 
        message: 'Failed to retrieve transactions summary', 
        success: false, error: 'Failed to retrieve transactions summary'
    });
  }
};

exports.getTransactionsExport = async (req, res) => {
  try {
    const paystackResponse = await axios.get(
      'https://api.paystack.co/transaction/export',
      { headers }
    );

    return response(res, 200, {
      message: 'Transactions export retrieved successfully',
      success: true,
      status: paystackResponse.data.data.status,
      data: paystackResponse.data.data,
    });
  } catch (err) {
    console.error('Paystack Verify Error:', err.response?.data || err.message);
    return response(res, 500, { 
        message: 'Failed to retrieve transactions export', 
        success: false, error: 'Failed to retrieve transactions export'
    });
  }
}
