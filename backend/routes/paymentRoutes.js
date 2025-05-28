const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const paystackController = require("../controllers/paystackController");
const payController = require("../controllers/payController");
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

//Paystack routes
router.post('/paystack/initialize', authenticateClient, paystackController.initializeTransaction);
router.get('/paystack/verify/:reference', authenticateClient, paystackController.verifyTransaction);

router.post("/combined", authenticateClient, payController.createCheckoutSessionCombined);
router.get("/paystackverify/:reference", authenticateClient, payController.verifyPaystackPayment);

router.get("/:orderNumber", authenticateClient, paymentController.getPaymentStatus);
router.get("/:usersId", authenticateClient, paymentController.getClientPayments);

module.exports = router;
