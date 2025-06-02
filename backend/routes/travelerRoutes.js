const express = require("express");
const router = express.Router();
const travelerController = require("../controllers/travelerController");
const { authenticateClient } = require("../middlewares/authMiddleware");
const multer = require('multer');
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit


// Claim a product
router.post("/products/claim", authenticateClient, travelerController.assignFulfilment);

// Get all claimed products for a traveler
router.get("/products/claimed/:travelerId", authenticateClient,travelerController.getClaimedProducts);

router.get('/earnings', authenticateClient, travelerController.getTravelerEarnings);

router.get('/history', authenticateClient, travelerController.getTravelerHistory);

router.put('/orders/:orderNumber/status', authenticateClient, travelerController.updateOrderStatus);

router.get('/orders', authenticateClient, travelerController.getUnassignedOrders);

router.get('/orders/:travelerId', authenticateClient, travelerController.getTravelersOrders);

router.put('/proof/:productId', authenticateClient, travelerController.uploadDeliveryProof);

router.post('/deliveryProof/:productId', upload.single('deliveryProof'), authenticateClient, travelerController.uploadDeliveryProofFile);

module.exports = router;