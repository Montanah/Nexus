const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { authenticateClient } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */


/**
 * @swagger
 * /api/orders/{userId}:
 *   get:
 *     summary: Get all orders for a user
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of user's orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       404:
 *         description: No orders found
 *       500:
 *         description: Server error
 */

router.get('/', authenticateClient, checkoutController.getUserOrders);

/**
 * @swagger
 * /api/orders/{userId}/{orderNumber}:
 *   get:
 *     summary: Get specific order details
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number (e.g., ORD-ABC123)
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */
router.get('/:orderNumber', authenticateClient, checkoutController.getOrderDetails);

/**
 * @swagger
 * /api/orders/:orderNumber/payment:
 *   put:
 *     summary: Update paymentStatus after payment processing
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number (e.g., ORD-ABC123)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Bad request
 */
router.put('/:orderNumber/payment', authenticateClient, checkoutController.updatePaymentStatus); // PUT /api/orders/:orderNumber/payment

/**
 * @swagger
 * /api/orders/:orderNumber/delivery:
 *   put:
 *     summary: Update deliveryStatus after delivery processing
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number (e.g., ORD-ABC123)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delivery status updated successfully
 *       400:
 *         description: Bad request
 */
router.put('/deliveryStatus', authenticateClient, checkoutController.updateDeliveryStatus);

router.put('/clientDeliveryStatus', authenticateClient, checkoutController.updateProductDeliveryStatus);
/**
 * @swagger
 * /api/orders/:orderNumber:
 *   delete:
 *     summary: Cancel an order if payment is pending.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number (e.g., ORD-ABC123)
 *     responses:
 *       200:
 *         description: Order canceled successfully
 *       400:
 *         description: Bad request
 */

router.put('/:orderNumber', authenticateClient, checkoutController.cancelOrder);

/**
 * @swagger
 * /api/orders/:orderNumber/claim:
 *   put:
 *     summary: Assign a traveler to an order if payment is pending.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Order number (e.g., ORD-ABC123)
 *     responses:
 *       200:
 *         description: Traveler assigned successfully
 *       400:
 *         description: Bad request
 */
router.put('/:orderNumber/claim', authenticateClient, checkoutController.assignTraveler);

/**
 * @swagger
 * /api/orders/:orderId:
 *   delete:
 *     summary: Delete an order if payment is pending.
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order canceled successfully
 *       400:
 *         description: Bad request
 */
router.delete('/:orderId', authenticateClient, checkoutController.deleteOrder);

module.exports = router;