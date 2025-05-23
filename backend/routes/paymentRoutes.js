const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticateClient } = require("../middlewares/authMiddleware");

router.post("/pay", authenticateClient, paymentController.processPayment);
router.post("/release", authenticateClient, paymentController.releaseFunds);
router.post("/dispute", authenticateClient, paymentController.raiseDispute);
router.post("/dispute/resolve", authenticateClient, paymentController.resolveDispute);

//Payment routes
router.post("/mpesa", authenticateClient, paymentController.processMpesaPayment);
router.post("/stripe", authenticateClient, paymentController.processStripePayment);
router.post("/mpesa/callback", authenticateClient, paymentController.handleMpesaCallback);
router.post("/airtel", authenticateClient, paymentController.processAirtelPayment);
router.post("/airtel/callback", authenticateClient, paymentController.handleAirtelCallback);

router.get("/:orderNumber", authenticateClient, paymentController.getPaymentStatus);
router.get("/:usersId", authenticateClient, paymentController.getClientPayments);

module.exports = router;
