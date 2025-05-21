const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const Dispute = require("../models/Dispute");

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
