const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { upload, convertToBase64 } = require("../middlewares/uploadMiddleware"); // For file uploads

/**
 * @swagger
 * /update:
 *   post:
 *     summary: Update delivery status
 *     tags: [Delivery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryId:
 *                 type: string
 *               status:
 *                 type: string 
 *     responses:
 *       200:
 *         description: Delivery status updated successfully 
 */
router.post("/update", deliveryController.updateStatus);

/**
 * @swagger
 * /proof:
 *   post:
 *     summary: Upload Proof of delivery
 *     tags: [Delivery]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryId:
 *                 type: string
 *               proofOfDelivery:
 *                 type: string 
 *     responses:
 *       200:
 *         description: Uploaded successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/proof", upload, convertToBase64, deliveryController.uploadProofOfDelivery);
router.get("/client/:clientId", deliveryController.getClientDeliveries);

module.exports = router;

