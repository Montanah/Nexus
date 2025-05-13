const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateClient } = require("../middlewares/authMiddleware");
const cartController = require("../controllers/cartController");
const { authenticate } = require("passport");
/**
 * @swagger
 * tags:
 *   name: Carts
 *   description: Shopping cart management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         product:
 *           $ref: '#/components/schemas/Product'
 *         quantity:
 *           type: number
 *           example: 1
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         user:
 *           type: string
 *           example: "611f1f77bcf86cd799439022"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     AddToCartRequest:
 *       type: object
 *       required:
 *         - productID
 *         - quantity
 *       properties:
 *         productID:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         quantity:
 *           type: number
 *           minimum: 1
 *           example: 1
 *     RemoveFromCartRequest:
 *       type: object
 *       required:
 *         - productID
 *       properties:
 *         productID:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/cart/:
 *   post:
 *     summary: Add item to cart
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       200:
 *         description: Item added to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 *
 *   get:
 *     summary: Get user's cart
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       404:
 *         description: Cart not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */

router.post("/", authenticateClient, cartController.addToCart);
router.get("/", authenticateClient, cartController.getCart);
router.delete("/product/", authenticateClient, cartController.removeFromCart);

/**
 * @swagger
 * /api/cart/product/:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoveFromCartRequest'
 *     responses:
 *       200:
 *         description: Item removed from cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cart:
 *                   $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: Product not found in cart
 *       500:
 *         description: Server error
 */

router.delete("/", authenticate, cartController.clearCart);

router.post("/wishlist", authenticateClient, cartController.saveForLater);
router.get("/wishlist", authenticateClient, cartController.getWishlist);
router.post("/checkout", authenticateClient, cartController.checkout);

module.exports = router;