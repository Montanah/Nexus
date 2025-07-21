const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const paystackController = require("../controllers/paystackController");
const payController = require("../controllers/payController");
const { authenticateClient } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/payment/pay:
 *   post:
 *     summary: Process a payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.post("/pay", authenticateClient, paymentController.processPayment);

/**
 * @swagger
 * /api/payment/release:
 *   post:
 *     summary: Release escrowed funds
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Funds released
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
router.post("/release", authenticateClient, paymentController.releaseFunds);

/**
 * @swagger
 * /api/payment/dispute:
 *   post:
 *     summary: Raise a dispute
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute raised
 */
router.post("/dispute", authenticateClient, paymentController.raiseDispute);

/**
 * @swagger
 * /api/payment/dispute/resolve:
 *   post:
 *     summary: Resolve a dispute
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               resolutionNote:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute resolved
 */
router.post("/dispute/resolve", authenticateClient, paymentController.resolveDispute);

//Payment routes
/**
 * @swagger
 * /api/payment/mpesa:
 *   post:
 *     summary: Process M-Pesa payment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment initiated
 */
router.post("/mpesa", authenticateClient, paymentController.processMpesaPayment);
router.post("/stripe", authenticateClient, paymentController.processStripePayment);

/**
 * @swagger
 * /api/payment/mpesa/callback:
 *   post:
 *     summary: M-Pesa callback
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Callback received
 */
router.post("/mpesa/callback", authenticateClient, paymentController.handleMpesaCallback);
router.post("/airtel", authenticateClient, paymentController.processAirtelPayment);
router.post("/airtel/callback", authenticateClient, paymentController.handleAirtelCallback);

//Paystack routes
/**
 * @swagger
 * /api/payment/paystack/initialize:
 *   post:
 *     summary: Initialize Paystack transaction
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Initialization successful
 */
router.post('/paystack/initialize', authenticateClient, paystackController.initializeTransaction);

/**
 * @swagger
 * /api/payment/paystack/verify/{reference}:
 *   get:
 *     summary: Verify Paystack transaction
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         schema:
 *           type: string
 *         required: true
 *         description: Transaction reference
 *     responses:
 *       200:
 *         description: Transaction verified
 */
router.get('/paystack/verify/:reference', authenticateClient, paystackController.verifyTransaction);

/**
 * @swagger
 * /api/payment/combined:
 *   post:
 *     summary: Create a combined checkout session
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Checkout session created
 */
router.post("/combined", authenticateClient, payController.createCheckoutSessionCombined);

/**
 * @swagger
 * /api/payment/paystackverify/{reference}:
 *   get:
 *     summary: Alternate Paystack verification route
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.get("/paystackverify/:reference", authenticateClient, payController.verifyPaystackPayment);

/**
 * @swagger
 * /api/payment/mpesacallback:
 *   post:
 *     summary: Handle M-Pesa callback (alternate route)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Callback handled
 */
router.post("/mpesacallback", authenticateClient, payController.handleMpesaCallback);

/**
 * @swagger
 * /api/payment/{orderNumber}:
 *   get:
 *     summary: Get payment status by order number
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment status
 */
router.get("/:orderNumber", authenticateClient, paymentController.getPaymentStatus);

/**
 * @swagger
 * /api/payment/{usersId}:
 *   get:
 *     summary: Get payments for a user
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usersId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user payments
 */
router.get("/:usersId", authenticateClient, paymentController.getClientPayments);

module.exports = router;
