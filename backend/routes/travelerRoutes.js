const express = require("express");
const router = express.Router();
const travelerController = require("../controllers/travelerController");
const { authenticateClient } = require("../middlewares/authMiddleware");

// Search & filter products
router.get("/products", travelerController.getProductsForTravelers);

// Get product details
router.get("/products/:id", travelerController.getProductDetails);

// Claim a product
router.post("/products/claim", authenticateClient, travelerController.assignFulfilment);

// Get all claimed products for a traveler
router.get("/products/claimed/:travelerId", travelerController.getClaimedProducts);

// Mark a product as delivered
router.put("/products/:id/delivered", travelerController.markAsDelivered);

router.get('/earnings', authenticateClient, travelerController.getTravelerEarnings);

router.get('/:travelerId/history', authenticateClient, travelerController.getTravelerHistory);

router.put('/orders/:orderNumber/status', authenticateClient, travelerController.updateOrderStatus);

router.get('/orders', authenticateClient, travelerController.getUnassignedOrders);

module.exports = router;
