const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateClient } = require("../middlewares/authMiddleware");
const cartController = require("../controllers/cartController");

router.post("/cart", authenticateClient, cartController.addToCart);
router.get("/cart", authenticateClient, cartController.getCart);
router.delete("/cart", authenticateClient, cartController.removeFromCart);
router.post("/wishlist", authenticateClient, cartController.saveForLater);
router.get("/wishlist", authenticateClient, cartController.getWishlist);
router.post("/checkout", authenticateClient, cartController.checkout);
router.get("/orders", authenticateClient, cartController.getUserOrders);

module.exports = router;