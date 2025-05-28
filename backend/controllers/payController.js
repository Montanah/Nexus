const { v4: uuidv4 } = require('uuid');
const Cart = require('../models/Cart'); // Adjust path as needed
const Order = require('../models/Order'); // Adjust path as needed
const PaymentLog = require('../models/PaymentLog'); // Adjust path as needed
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const response = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode,
    description: statusCode === 200 ? 'Success' : 'Error',
    success: statusCode === 200,
    data,
  });
};

exports.createCheckoutSessionCombined = async (req, res) => {
  try {
    const { userId, paymentMethod, phoneNumber, amount, paymentMethodId, email, cartItems, voucherCode } = req.body;

    // Validate input
    if (!userId || !paymentMethod || !amount || !cartItems || !Array.isArray(cartItems)) {
      return response(res, 400, { message: 'Missing or invalid required parameters' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return response(res, 400, { message: 'Amount must be a number and greater than 0' });
    }
    console.log("amount", amount)
    console.log("cartItems", cartItems)
    // Calculate total amount and prepare order items
    let totalAmount = 0;
    const orderItems = cartItems.map(item => {
      const productPrice = item.productFee || 0;
      totalAmount += productPrice * item.quantity * 1.15;
      return {
        product: item.productId,
        quantity: item.quantity,
      };
    });

    if (Math.abs(totalAmount - amount) > 0.01) {
      return response(res, 400, { message: 'Amount mismatch with cart total' });
    }

    // Apply voucher code if provided (add your voucher logic here)
    if (voucherCode) {
      // Implement voucher validation and discount logic
      // For example, reduce totalAmount if voucher is valid
    }

    // Create order
    const orderNumber = generateOrderNumber();
    // const orderNumber = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;
    const newOrder = new Order({
      userId,
      orderNumber,
      items: orderItems,
      totalAmount,
      paymentStatus: 'Pending',
      paymentMethod,
      deliveryStatus: 'Pending',
    });
    const savedOrder = await newOrder.save();

    let paymentResponse;
    let checkoutId;

    // Handle payment based on payment method
    switch (paymentMethod) {
      case 'Mpesa':
        if (!phoneNumber) {
          return response(res, 400, { message: 'Phone number required for M-Pesa payment' });
        }
        const mpesaToken = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
        paymentResponse = await axios.post(
          'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
          {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: orderNumber,
            TransactionDesc: `Payment for order ${orderNumber}`,
          },
          {
            headers: {
              Authorization: `Bearer ${mpesaToken}`,
            },
          }
        );
        checkoutId = paymentResponse.data.CheckoutRequestID;
        await PaymentLog.create({
          userId,
          orderNumber,
          paymentLogsId: checkoutId,
          paymentMethod: 'Mpesa',
          amount,
          status: 'Pending',
          rawResponse: paymentResponse.data,
        });
        break;

      case 'Airtel':
        if (!phoneNumber) {
          return response(res, 400, { message: 'Phone number required for Airtel payment' });
        }
        const airtelTokenResponse = await axios.post(
          `${process.env.AIRTEL_API_URL}/auth/oauth2/token`,
          'grant_type=client_credentials',
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${Buffer.from(
                `${process.env.AIRTEL_CLIENT_ID}:${process.env.AIRTEL_CLIENT_SECRET}`
              ).toString('base64')}`,
            },
          }
        );
        paymentResponse = await axios.post(
          `${process.env.AIRTEL_API_URL}/merchant/v1/payments/`,
          {
            reference: orderNumber,
            subscriber: {
              country: 'KE',
              currency: 'KES',
              msisdn: phoneNumber,
            },
            transaction: {
              amount: amount,
              country: 'KE',
              currency: 'KES',
              id: orderNumber,
            },
          },
          {
            headers: {
              'X-Country': 'KE',
              'X-Currency': 'KES',
              Authorization: `Bearer ${airtelTokenResponse.data.access_token}`,
            },
          }
        );
        checkoutId = paymentResponse.data.data.transaction.id;
        await PaymentLog.create({
          userId,
          orderNumber,
          paymentLogsId: checkoutId,
          paymentMethod: 'Airtel',
          amount,
          status: 'Pending',
          rawResponse: paymentResponse.data,
        });
        break;

      case 'Stripe':
        if (!paymentMethodId) {
          return response(res, 400, { message: 'Payment method ID required for Stripe payment' });
        }
        paymentResponse = await stripe.paymentIntents.create({
          amount: parseInt(amount) * 100,
          currency: 'kes',
          payment_method: paymentMethodId,
          confirm: true,
          metadata: { userId, orderNumber },
        });
        checkoutId = paymentResponse.id;
        const status = paymentResponse.status === 'succeeded' ? 'Paid' : 'Pending';
        await PaymentLog.create({
          userId,
          orderNumber,
          paymentLogsId: checkoutId,
          paymentMethod: 'Stripe',
          amount,
          status,
          rawResponse: paymentResponse,
        });
        break;

      case 'Paystack':
        if (!email) {
          return response(res, 400, { message: 'Email required for Paystack payment' });
        }
        paymentResponse = await axios.post(
          'https://api.paystack.co/transaction/initialize',
          {
            email,
            amount: parseInt(amount) * 100,
            metadata: { userId, orderNumber },
            callback_url: process.env.PAYSTACK_CALLBACK_URL
          },
          { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
        );
        checkoutId = paymentResponse.data.data.reference;
        await PaymentLog.create({
          userId,
          orderNumber,
          paymentLogsId: checkoutId,
          paymentMethod: 'Paystack',
          amount,
          status: 'Paid',
          rawResponse: paymentResponse.data,
        });
        break;

      default:
        return response(res, 400, { message: 'Unsupported payment method' });
    }

    // Update order with payment status
    await Order.findOneAndUpdate(
      { orderNumber },
      { paymentStatus: paymentResponse.status || 'Paid', paymentMethod }
    );
    
    return response(res, 200, {
      success: true,
      message: 'Payment initiated successfully',
      orderNumber,
      transactionId: checkoutId,
      authorizationUrl: paymentResponse.data?.data?.authorization_url,
      sessionId: paymentResponse.id || undefined,
      clientSecret: paymentResponse.client_secret || undefined,
      status: paymentResponse.status || 'Paid',
    });
  } catch (error) {
    console.error('Error in combined checkout:', error);
    return response(res, 500, {
      message: 'Error initiating payment',
      error: error.message || 'Unknown error',
    });
  }
};

const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `ORD-${timestamp}-${random}`;
};


exports.verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify payment with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );

    const paymentData = paystackResponse.data.data;
    const status = paymentData.status === 'success' ? 'Paid' : 'Failed';

    // Find the PaymentLog to get orderNumber
    const paymentLog = await PaymentLog.findOne({ paymentLogsId: reference });
    if (!paymentLog) {
      return response(res, 404, { message: 'Payment log not found' });
    }

    // Update PaymentLog
    await PaymentLog.findOneAndUpdate(
      { paymentLogsId: reference },
      {
        status,
        rawResponse: paystackResponse.data,
      }
    );

    // Update Order
    await Order.findOneAndUpdate(
      { orderNumber: paymentLog.orderNumber },
      { paymentStatus: status }
    );

    if (status === 'Paid') {
      await Cart.findOneAndUpdate(
        { user: paymentLog.userId },
        { $set: { items: [] } },
        { new: true }
      );
    }

    return response(res, 200, {
      success: true,
      status: paymentData.status,
      email: paymentData.customer.email,
      amount: paymentData.amount,
      orderNumber: paymentLog.orderNumber,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Paystack verification error:', error);
    return response(res, 500, {
      message: 'Error verifying payment',
      error: error.response?.data?.message || error.message || 'Unknown error',
    });
  }
};

exports.handleMpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body.Body.stkCallback;
    const checkoutRequestID = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;

    // Find PaymentLog
    const paymentLog = await PaymentLog.findOne({ paymentLogsId: checkoutRequestID });
    if (!paymentLog) {
      console.error('Payment log not found for CheckoutRequestID:', checkoutRequestID);
      return res.status(404).json({ message: 'Payment log not found' });
    }

    // Determine payment status
    const status = resultCode === 0 ? 'Paid' : 'Failed';

    // Update PaymentLog
    await PaymentLog.findOneAndUpdate(
      { paymentLogsId: checkoutRequestID },
      {
        status,
        rawResponse: callbackData,
      }
    );

    // Update Order
    await Order.findOneAndUpdate(
      { orderNumber: paymentLog.orderNumber },
      { paymentStatus: status }
    );

    // Clear cart if payment is successful
    if (status === 'Paid') {
      await Cart.findOneAndUpdate(
        { user: paymentLog.userId },
        { $set: { items: [] } },
        { new: true }
      );
    }

    return res.status(200).json({ message: 'Callback processed' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return res.status(500).json({ message: 'Error processing callback', error: error.message });
  }
};