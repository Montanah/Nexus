const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticateClient } = require("../middlewares/authMiddleware");
const multer = require("multer");

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

// Routes
/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - productName
 *         - productDescription
 *         - productCategory
 *         - productWeight
 *         - productDimensions
 *         - destination
 *         - productFee
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the product
 *         productName:
 *           type: string
 *           description: Name of the product
 *         productDescription:
 *           type: string
 *           description: A short description of the product
 *         productCategory:
 *           type: string
 *           description: Category of the product
 *         productWeight:
 *           type: number
 *           description: Weight of the product in kg
 *         productDimensions:
 *           type: string
 *           description: Dimensions of the product (e.g., "10x20x5 cm")
 *         destination:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             country:
 *               type: string
 *           description: Destination details
 *         productFee:
 *           type: number
 *           description: The fee for the product
 *         productMarkup:
 *           type: number
 *           description: Markup amount added to the base product fee
 *         totalPrice:
 *           type: number
 *           description: Total price including markup
 *         urgencyLevel:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Urgency level for delivery
 *       example:
 *         productName: "Laptop"
 *         productDescription: "Gaming laptop with RTX 3060"
 *         productCategory: "Electronics"
 *         productWeight: 2.5
 *         productDimensions: "35x25x2 cm"
 *         destination:
 *           city: "Nairobi"
 *           country: "Kenya"
 *         productFee: 1000
 *         productMarkup: 150
 *         totalPrice: 1150
 *         urgencyLevel: "high"
 */

/**
 * @swagger
 * /products/:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               productDescription:
 *                 type: string
 *               productCategory:
 *                 type: string
 *               productWeight:
 *                 type: number
 *               productDimensions:
 *                 type: string
 *               destination:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *               productFee:
 *                 type: number
 *               urgencyLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", authenticateClient, upload.array("images", 5), productController.createProduct);

/**
 * @swagger
 * /products/:
 *   get:
 *     summary: Retrieve all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *       500:
 *         description: Server error
 */      
router.get("/", productController.getAllProducts);

/**
 * @swagger
 * /products/{userid}:
 *   get:
 *     summary: Retrieve all products for a specific client
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: userid
 *         required: true
 *         description: The ID of the client whose products are to be retrieved
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "603c72ef2f7b2b3c2e7fded3"
 *                       name:
 *                         type: string
 *                         example: "Product 1"
 *                       client:
 *                         type: string
 *                         example: "603c72ef2f7b2b3c2e7fded4"
 *                       price:
 *                         type: number
 *                         example: 99.99
 *                       description:
 *                         type: string
 *                         example: "A description of the product."
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching products"
 *                 error:
 *                   type: object
 *                   additionalProperties: true
 */
router.get("/:userid", productController.getClientProducts);

/**
 * @swagger
 * /products/{productid}:
 *   get:
 *     summary: Retrieve a specific product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productid
 *         required: true
 *         description: The ID of the product to be retrieved
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved products"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching products"
 *                 error:
 *                   type: object
 *                   additionalProperties: true
 */
router.get("/product/:productId", productController.getProductById);

/**
 * @swagger
 * /products/:id:
 *   put:
 *     summary: Update a specific product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the product to be updated
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *               productDescription:
 *                 type: string
 *               productCategory:
 *                 type: string
 *               productWeight: 
 *                 type: number
 *               productDimensions:
 *                 type: string
 *               destination:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   country:
 *                     type: string
 *               productFee:
 *                 type: number
 *               productMarkup:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *               urgencyLevel:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authenticateClient, productController.updateProduct);

/**
 * @swagger
 * /products/:id:
 *   delete:
 *     summary: Delete a specific product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the product to be deleted
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authenticateClient, productController.deleteProduct);

module.exports = router;
