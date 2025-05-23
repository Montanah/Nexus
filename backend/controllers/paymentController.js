const Stripe = require('stripe');
const axios = require('axios');
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const Dispute = require("../models/Dispute");
const PaymentLog = require("../models/PaymentLog");
require('dotenv').config();

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
} = process.env;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const response = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode,
    description: statusCode === 200 ? 'Success' : 'Error',
    success: statusCode === 200,
    data,
  });
};
// process payment
exports.processPayment = async (req, res) => {
    try {
        const { clientId, productId, totalAmount } = req.body;

        const payment = new Payment({
            client: clientId,
            product: productId,
            totalAmount
        });

        await payment.save();
        return response(res, 201, { message: "Payment processed successfully", payment });
    } catch (error) {
        return response(res, 500, { message: "Error processing payment", error });
    }
};


// Release funds
exports.releaseFunds = async (req, res) => {
    try {
        const { paymentId, travelerId } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== "escrow") {
            return response(res, 400, { message: "Invalid escrow transaction" });
        }

        // Calculate reward & platform fee
        const markup = payment.totalAmount * 0.15;
        const travelerReward = markup * 0.6; // 60%
        const companyFee = markup * 0.4; // 40%

        // Mark payment as released
        payment.status = "released";
        payment.traveler = travelerId;
        await payment.save();

        // Log transaction
        await Transaction.create({
            payment: paymentId,
            travelerReward,
            companyFee
        });
        return response(res, 200, { message: "Funds released to traveler", travelerReward, companyFee });
    } catch (error) {
        return response(res, 500, { message: "Error releasing funds", error });
    }
};


// raise dispute

exports.raiseDispute = async (req, res) => {
    try {
        const { paymentId, clientId, reason } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== "escrow") {
            return response(res, 400, { message: "Invalid escrow transaction" }); 
        }

        const dispute = new Dispute({ payment: paymentId, client: clientId, reason });
        await dispute.save();

        // Mark payment as disputed
        payment.status = "disputed";
        await payment.save();
        return response(res, 201, { message: "Dispute raised successfully", dispute });
    } catch (error) {
        return response(res, 500, { message: "Error raising dispute", error });
    }
};

// Admin resolves dispute (refund or release funds)
exports.resolveDispute = async (req, res) => {
    try {
        const { disputeId, action } = req.body; // action: "refund" or "release"

        const dispute = await Dispute.findById(disputeId).populate("payment");
        if (!dispute || dispute.status !== "open") {
            return response(res, 400, { message: "Invalid dispute" });
        }

        const payment = dispute.payment;
        if (action === "refund") {
            payment.status = "refunded";
            dispute.status = "resolved";
        } else if (action === "release") {
            payment.status = "released";
            dispute.status = "resolved";
        } else {
            return response(res, 400, { message: "Invalid action" });
        }

        await payment.save();
        await dispute.save();

        return response(res, 200, { message: `Dispute resolved: ${action}`, dispute });
    } catch (error) {
        return response(res, 500, { message: "Error resolving dispute", error });
    }
};

const getMpesaToken = async () => {
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });
  return response.data.access_token;
};

exports.processMpesaPayment = async (req, res) => {
    try {
        const { userId, orderNumber, phoneNumber, amount } = req.body;

        const token = await getMpesaToken();

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

        const payload = {
            BusinessShortCode: MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: MPESA_CALLBACK_URL,
            AccountReference: orderNumber,
            TransactionDesc: `Payment for order ${orderNumber}`
        };

        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const checkoutId = response.data.CheckoutRequestID;

        //save TransactionDetails
        await PaymentLog.create({
            userId,
            orderNumber,
            paymentLogsId: checkoutId,
            paymentMethod: "Mpesa",
            amount,
            status: "Pending",
            rawResponse: response.data
        });

        //update Order
        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return response(res, 404, { message: "Order not found" });
        }
        order.paymentStatus = "Pending";
        order.paymentMethod = "Mpesa";
        await order.save();

        return response(res, 200, {
            message: "Mpesa payment initiated",
            transactionId: response.data.CheckoutRequestID,
            status: response.data.ResponseDescription
        });
    } catch (err) {
        return response(res, 500, { message: "Error processing Mpesa payment", error: err.message });
    }
}

exports.processStripePayment = async (req, res) => {
    const { userId, orderNumber, paymentMethodId, amount } = req.body;

    try {   
        const paymentIntent = await stripe.paymentIntents.create({
            amount: parseInt(amount) * 100,
            currency: 'kes',
            payment_method: paymentMethodId,
            confirm: true,
            metadata: { userId, orderNumber }
        });

        const status = paymentIntent.status === "succeeded" ? "Paid" : "Pending";

        //save TransactionDetails
        await PaymentLog.create({
            userId,
            orderNumber,
            paymentLogsId: paymentIntent.id,
            paymentMethod: "Stripe",
            amount,
            status,
            rawResponse: paymentIntent
        });

        //update Order
        const order = await Order.findOne({ orderNumber });
        if (!order) {
            return response(res, 404, { message: "Order not found" });
        }
        order.paymentStatus = status;
        order.paymentMethod = "Stripe";
        await order.save();

        return response(res, 200, {
            message: "Stripe payment initiated",
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status,
            paymentIntentId: paymentIntent.id
        });
    } catch (err) {
        return response(res, 500, { message: "Error processing Stripe payment", error: err.message });
    }
};

exports.handleMpesaCallback = async (req, res) => { 
    try {
        const callbackData = req.body;

        const stkCallback = callbackData?.Body?.stkCallback;
        const transactionId = stkCallback.CheckoutRequestID;

        // Determine if payment was successful
        const resultCode = stkCallback.ResultCode;
        const resultDesc = stkCallback.ResultDesc;
        const amount = stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "Amount")?.Value;
        const orderNumber = stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "AccountReference")?.Value;

        const status = resultCode === 0 ? "Paid" : "Failed";

        // Update Transaction
        await PaymentLog.findOneAndUpdate(
            { paymentLogsId: transactionId },
            {
                status,
                rawResponse: stkCallback
            }
        );

        // Update Order
        await Order.findOneAndUpdate(
            { orderNumber },
            { paymentStatus: status }
        );

        return response(res, 200, {
            message: "Callback received successfully",
            transactionId,
            amount,
            status,
            orderNumber
        })
    } catch (err) {
        console.error('M-Pesa callback error:', err.message);
        return response(res, 500, { message: "Error processing Mpesa callback", error: err.message });
    }
};

exports.processAirtelPayment = async (req, res) => {
  try {
    const { userId, orderNumber, phoneNumber, amount } = req.body;

     const auth = Buffer.from(`${process.env.AIRTEL_CLIENT_ID}:${process.env.AIRTEL_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await axios.post(
      `${process.env.AIRTEL_API_URL}/auth/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${auth}`
        }
      }
    );
     const paymentResponse = await axios.post(
      `${process.env.AIRTEL_API_URL}/merchant/v1/payments/`,
      {
        reference: orderNumber,
        subscriber: {
          country: 'KE',
          currency: 'KES',
          msisdn: phoneNumber
        },
        transaction: {
          amount: amount,
          country: 'KE',
          currency: 'KES',
          id: orderNumber
        }
      },
      {
        headers: {
          'X-Country': 'KE',
          'X-Currency': 'KES',
          Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
      }
    );

    // 4. Save Payment Log
    await PaymentLog.create({
      userId,
      orderNumber,
      paymentLogsId: paymentResponse.data.data.transaction.id,
      paymentMethod: "Airtel",
      amount,
      status: "Pending",
      rawResponse: paymentResponse.data
    });

    // 5. Update Order
    await Order.findOneAndUpdate(
      { orderNumber },
      { paymentStatus: "Pending", paymentMethod: "Airtel" }
    );

    return response(res, 200, {
      message: "Airtel payment initiated",
      transactionId: paymentResponse.data.data.transaction.id
    });

  } catch (error) {
    console.error('Airtel Payment Error:', error.response?.data || error.message);
    return response(res, 500, {
      message: error.response?.data?.status?.message || 'Airtel payment failed'
    });
  }
};

// ===== AIRTEL CALLBACK HANDLER =====
exports.handleAirtelCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    const stkCallback = callbackData?.Body?.stkCallback;
    const transactionId = stkCallback.CheckoutRequestID;

    // Determine if payment was successful
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const amount = stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "Amount")?.Value;
    const orderNumber = stkCallback.CallbackMetadata?.Item?.find(i => i.Name === "AccountReference")?.Value;

    const status = resultCode === 0 ? "Paid" : "Failed";

    // 2. Update payment status
    const transaction = await PaymentLog.findOneAndUpdate(
      { paymentLogsId: callbackData.transaction.id },
      {
        status: callbackData.transaction.status === "KES" ? "Paid" : "Failed",
        rawResponse: callbackData
      },
      { new: true }
    );

    // 3. Update associated order
    if (transaction) {
      await Order.findOneAndUpdate(
        { orderNumber: transaction.orderNumber },
        { paymentStatus: transaction.status }
      );
    }

    return response(res, 200, { message: "Callback processed" });

  } catch (error) {
    console.error('Airtel Callback Error:', error);
    return response(res, 500, { message: "Failed to process callback" });
  }
};

exports.getPaymentStatus = async (req, res) => {
    try {
        const payment = await PaymentLog.findOne(req.params.orderNumber);
        return response(res, 200, { message: "Payment status fetched successfully", payment });
    } catch (error) {
        return response(res, 500, { message: "Error fetching payment status", error });
    }
};

exports.getClientPayments = async (req, res) => {
    try {
        const payments = await PaymentLog.find({ userId: req.params.usersId });
        return response(res, 200, { message: "Payments fetched successfully", payments });
    } catch (error) {
        return response(res, 500, { message: "Error fetching payments", error });
    }
}