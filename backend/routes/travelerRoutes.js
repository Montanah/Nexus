const express = require("express");
const router = express.Router();
const travelerController = require("../controllers/travelerController");
const { authenticateClient } = require("../middlewares/authMiddleware");


// Claim a product
router.post("/products/claim", authenticateClient, travelerController.assignFulfilment);

// Get all claimed products for a traveler
router.get("/products/claimed/:travelerId", authenticateClient,travelerController.getClaimedProducts);

router.get('/earnings', authenticateClient, travelerController.getTravelerEarnings);

router.get('/history', authenticateClient, travelerController.getTravelerHistory);

router.put('/orders/:orderNumber/status', authenticateClient, travelerController.updateOrderStatus);

router.get('/orders', authenticateClient, travelerController.getUnassignedOrders);

router.get('/orders/:travelerId', authenticateClient, travelerController.getTravelersOrders);

router.put('/proof/:orderId', authenticateClient, travelerController.uploadDeliveryProof);
module.exports = router;
