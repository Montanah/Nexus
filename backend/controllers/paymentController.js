const Stripe = require('stripe');
const axios = require('axios');
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const Dispute = require("../models/Dispute");
const PaymentLog = require("../models/PaymentLog");
const Notification = require("../models/Notification");
const Order = require('../models/Order');
const { notificationTemplates } = require("./notificationController");
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
// Enhanced processPayment
exports.processPayment = async (req, res) => {
    try {
        const { clientId, orderId, productId, amount, paymentMethod } = req.body;
        
        // Calculate amounts
        const productAmount = amount / 1.15; 
        const markupAmount = amount - productAmount;
        
        // Create payment record
        const payment = new Payment({
            client: clientId,
            order: orderId,
            product: productId,
            productAmount,
            markupAmount,
            totalAmount: amount,
            paymentMethod
        });

        await payment.save();
        
        // Send notification to client
        await Notification.create({
            recipient: clientId,
            relatedEntity: payment._id,
            relatedEntityModel: "Payment",
            ...notificationTemplates.paymentReceived(payment)
        });

        // Create escrow transaction record
        await Transaction.create({
            payment: payment._id,
            type: "escrow_deposit",
            amount,
            status: "completed"
        });

        return response(res, 201, { 
            message: "Payment processed and placed in escrow",
            payment 
        });
    } catch (error) {
        return response(res, 500, { 
            message: "Error processing payment", 
            error: error.message 
        });
    }
};


// Release funds
exports.releaseFunds = async (req, res) => {
    try {
        const { paymentId, travelerId } = req.body;

        const payment = await Payment.findById(paymentId);
        
        // Validation checks
        if (!payment) {
            return response(res, 404, { message: "Payment not found" });
        }
        if (payment.status !== "escrow") {
            return response(res, 400, { 
                message: "Funds can only be released from escrow" 
            });
        }
        if (new Date() < payment.escrowReleaseDate) {
            return response(res, 400, { 
                message: "Escrow period not yet completed" 
            });
        }

        // Calculate splits
        const travelerReward = payment.markupAmount * 0.6;
        const companyFee = payment.markupAmount * 0.4;

        // Update payment status
        payment.status = "released";
        payment.traveler = travelerId;
        await payment.save();

        // Create transaction records
        await Promise.all([
            Transaction.create({
                payment: paymentId,
                type: "traveler_reward",
                amount: travelerReward,
                recipient: travelerId,
                status: "completed"
            }),
            Transaction.create({
                payment: paymentId,
                type: "company_fee",
                amount: companyFee,
                status: "completed"
            })
        ]);

        // Notify traveler
        await Notification.create({
            recipient: travelerId,
            relatedEntity: payment._id,
            relatedEntityModel: "Payment",
            ...notificationTemplates.escrowReleased(payment, travelerReward)
        });

        return response(res, 200, { 
            message: "Funds released successfully",
            travelerReward,
            companyFee
        });
    } catch (error) {
        return response(res, 500, { 
            message: "Error releasing funds", 
            error: error.message 
        });
    }
};


// raise dispute
exports.raiseDispute = async (req, res) => {
    try {
        const { paymentId, raisedById, reason, evidence = [] } = req.body;

        // Validate input
        if (!paymentId || !raisedById || !reason) {
            return response(res, 400, { 
                message: "Missing required fields: paymentId, raisedById, or reason" 
            });
        }

        // Check if payment exists and is in escrow
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return response(res, 404, { message: "Payment not found" });
        }
        
        if (payment.status !== "escrow") {
            return response(res, 400, { 
                message: "Disputes can only be raised against payments in escrow",
                currentStatus: payment.status
            }); 
        }

        // Verify the user raising the dispute is the client who made the payment
        if (payment.client.toString() !== raisedById) {
            return response(res, 403, { 
                message: "Only the payment client can raise a dispute" 
            });
        }

        // Check if dispute already exists for this payment
        const existingDispute = await Dispute.findOne({ 
            payment: paymentId, 
            status: { $in: ["open", "under_review"] } 
        });
        
        if (existingDispute) {
            return response(res, 409, { 
                message: "An active dispute already exists for this payment",
                existingDisputeId: existingDispute._id
            });
        }

        // Create new dispute
        const dispute = new Dispute({ 
            payment: paymentId,
            raisedBy: raisedById,
            against: payment.traveler, // The traveler is the one being disputed
            reason,
            evidence,
            status: "open"
        });

        await dispute.save();

        // Update payment status to disputed
        payment.status = "disputed";
        await payment.save();

        // Create a transaction log for the dispute
        await Transaction.create({
            payment: paymentId,
            type: "dispute_opened",
            amount: 0, // Or you could track dispute fees here if applicable
            status: "completed"
        });

         // Notify admin
        await Notification.create({
            recipient: adminUserId, 
            sender: raisedById,
            relatedEntity: dispute._id,
            relatedEntityModel: "Dispute",
            title: "New Dispute Raised",
            message: `A new dispute has been raised by a client: ${reason}`,
            type: "dispute_opened",
            metadata: { priority: "high" }
        });

        // Notify traveler if exists
        if (payment.traveler) {
            await Notification.create({
                recipient: payment.traveler,
                relatedEntity: dispute._id,
                relatedEntityModel: "Dispute",
                ...notificationTemplates.disputeOpened(dispute)
            });
        }

        return response(res, 201, { 
            message: "Dispute raised successfully", 
            dispute,
            actions: [
                "Notification sent to admin",
                "Payment frozen in escrow",
                "Dispute case created"
            ]
        });
    } catch (error) {
        console.error(`Dispute Error - Payment: ${paymentId}`, error);
        return response(res, 500, { 
            message: "Error raising dispute", 
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Admin resolves dispute (refund or release funds)
exports.resolveDispute = async (req, res) => {
    try {
        const { disputeId, action, amount, notes } = req.body;
        
        const dispute = await Dispute.findById(disputeId).populate("payment");
        if (!dispute) {
            return response(res, 404, { message: "Dispute not found" });
        }
        if (dispute.status !== "open") {
            return response(res, 400, { message: "Dispute already resolved" });
        }

        const payment = dispute.payment;
        let transactionType, transactionAmount;

        switch(action) {
            case "full_refund":
                transactionType = "client_refund";
                transactionAmount = payment.totalAmount;
                payment.status = "refunded";
                break;
                
            case "partial_refund":
                transactionType = "client_refund";
                transactionAmount = amount;
                payment.status = "refunded";
                break;
                
            case "release_funds":
                // Call releaseFunds logic
                await this.releaseFunds(
                    { body: { paymentId: payment._id, travelerId: payment.traveler } },
                    { json: () => {} }
                );
                break;
                
            default:
                return response(res, 400, { message: "Invalid action" });
        }

        // Update dispute resolution
        dispute.resolution = {
            action,
            amount: transactionAmount,
            notes
        };
        dispute.status = "resolved";
        
        await Promise.all([
            payment.save(),
            dispute.save(),
            action !== "release_funds" && Transaction.create({
                payment: payment._id,
                type: transactionType,
                amount: transactionAmount,
                recipient: payment.client,
                status: "completed"
            })
        ]);

        // Notify all parties
        const notifications = [
            {
                recipient: dispute.raisedBy,
                relatedEntity: dispute._id,
                relatedEntityModel: "Dispute",
                ...notificationTemplates.disputeResolved(dispute, resolution.notes)
            }
        ];

        if (dispute.against) {
            notifications.push({
                recipient: dispute.against,
                relatedEntity: dispute._id,
                relatedEntityModel: "Dispute",
                title: "Dispute Resolved",
                message: `The dispute against you has been resolved: ${resolution.notes}`,
                type: "dispute_resolved"
            });
        }

        await Notification.insertMany(notifications);

        return response(res, 200, { 
            message: `Dispute resolved with ${action}`,
            dispute 
        });
    } catch (error) {
        return response(res, 500, { 
            message: "Error resolving dispute", 
            error: error.message 
        });
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