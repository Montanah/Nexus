const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const Dispute = require("../models/Dispute");

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
        res.status(201).json({ message: "Payment held in escrow", payment });
    } catch (error) {
        res.status(500).json({ message: "Payment processing error", error });
    }
};


// Release funds
exports.releaseFunds = async (req, res) => {
    try {
        const { paymentId, travelerId } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== "escrow") {
            return res.status(400).json({ message: "Invalid escrow transaction" });
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

        res.status(200).json({ message: "Funds released to traveler", travelerReward, companyFee });
    } catch (error) {
        res.status(500).json({ message: "Error releasing funds", error });
    }
};


// raise dispute

exports.raiseDispute = async (req, res) => {
    try {
        const { paymentId, clientId, reason } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== "escrow") {
            return res.status(400).json({ message: "Invalid escrow transaction" });
        }

        const dispute = new Dispute({ payment: paymentId, client: clientId, reason });
        await dispute.save();

        // Mark payment as disputed
        payment.status = "disputed";
        await payment.save();

        res.status(201).json({ message: "Dispute raised successfully", dispute });
    } catch (error) {
        res.status(500).json({ message: "Error raising dispute", error });
    }
};

// Admin resolves dispute (refund or release funds)
exports.resolveDispute = async (req, res) => {
    try {
        const { disputeId, action } = req.body; // action: "refund" or "release"

        const dispute = await Dispute.findById(disputeId).populate("payment");
        if (!dispute || dispute.status !== "open") {
            return res.status(400).json({ message: "Invalid dispute" });
        }

        const payment = dispute.payment;
        if (action === "refund") {
            payment.status = "refunded";
            dispute.status = "resolved";
        } else if (action === "release") {
            payment.status = "released";
            dispute.status = "resolved";
        } else {
            return res.status(400).json({ message: "Invalid action" });
        }

        await payment.save();
        await dispute.save();

        res.status(200).json({ message: `Dispute resolved: ${action}`, dispute });
    } catch (error) {
        res.status(500).json({ message: "Error resolving dispute", error });
    }
};
