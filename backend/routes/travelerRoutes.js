const express = require("express");
const router = express.Router();
const travelerController = require("../controllers/travelerController");

// Search & filter products
router.get("/products", travelerController.getProductsForTravelers);

// Get product details
router.get("/products/:id", travelerController.getProductDetails);

// Claim a product
router.post("/products/:id/claim", travelerController.claimProduct);

// Get all claimed products for a traveler
router.get("/products/claimed/:travelerId", travelerController.getClaimedProducts);

// Mark a product as delivered
router.put("/products/:id/delivered", travelerController.markAsDelivered);

module.exports = router;
