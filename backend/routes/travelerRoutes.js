const express = require("express");
const router = express.Router();
const travelerController = require("../controllers/travelerController");
const { authenticateClient } = require("../middlewares/authMiddleware");
const multer = require('multer');
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

/**
 * @swagger
 * tags:
 *   name: Travelers
 *   description: Endpoints for traveler delivery and claims
 */

// Claim a product
/**
 * @swagger
 * /api/travelers/products/claim:
 *   post:
 *     summary: Traveler claims a product for delivery
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product claimed successfully
 */
router.post("/products/claim", authenticateClient, travelerController.assignFulfilment);

// Get all claimed products for a traveler
/**
 * @swagger
 * /api/travelers/products/claimed/{travelerId}:
 *   get:
 *     summary: Get all claimed products for a traveler
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: travelerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of claimed products
 */
router.get("/products/claimed/:travelerId", authenticateClient,travelerController.getClaimedProducts);

/**
 * @swagger
 * /api/travelers/earnings:
 *   get:
 *     summary: Get total earnings for the traveler
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Traveler earnings fetched
 */
router.get('/earnings', authenticateClient, travelerController.getTravelerEarnings);

/**
 * @swagger
 * /api/travelers/history:
 *   get:
 *     summary: Get delivery history for a traveler
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Traveler delivery history
 */
router.get('/history', authenticateClient, travelerController.getTravelerHistory);

/**
 * @swagger
 * /api/travelers/orders:
 *   get:
 *     summary: Get all unassigned orders
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unassigned orders fetched
 */
router.get('/orders', authenticateClient, travelerController.getUnassignedOrders);

/**
 * @swagger
 * /api/travelers/orders/{travelerId}:
 *   get:
 *     summary: Get all orders assigned to a traveler
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: travelerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Traveler orders fetched
 */
router.get('/orders/:travelerId', authenticateClient, travelerController.getTravelersOrders);

/**
 * @swagger
 * /api/travelers/deliveryProof/{productId}:
 *   post:
 *     summary: Upload delivery proof file (e.g., image)
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: formData
 *         name: deliveryProof
 *         type: file
 *         required: true
 *     responses:
 *       200:
 *         description: Delivery proof file uploaded
 */
router.post('/deliveryProof/:productId', upload.single('deliveryProof'), authenticateClient, travelerController.uploadDeliveryProofFile);

/**
 * @swagger
 * /api/travelers/proof/{productId}:
 *   put:
 *     summary: Upload delivery proof (text-based)
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryNote:
 *                 type: string
 *                 example: "Package delivered at 10 AM"
 *     responses:
 *       200:
 *         description: Delivery proof updated
 */
router.put('/proof/:productId', authenticateClient, travelerController.uploadDeliveryProof);

/**
 * @swagger
 * /api/travelers/orders/{orderNumber}/status:
 *   put:
 *     summary: Update status of a specific order
 *     tags: [Travelers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: delivered
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put('/orders/:orderNumber/status', authenticateClient, travelerController.updateOrderStatus);

module.exports = router;