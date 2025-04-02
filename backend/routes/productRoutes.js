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
 * tags:
 *   name: Products
 *   description: Product management and search
 */

/**
 * @swagger
 * /api/products/:
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
// router.post("/", authenticateClient, upload.array("images", 5), productController.createProduct);
router.post("/", authenticateClient, upload.array("images", 5), productController.createProductAndAddToCart);

/**
 * @swagger
 * /api/products/search/:
 *   post:
 *     summary: Search and filter products
 *     description: |
 *       Unified product search endpoint with advanced filtering, sorting and pagination.
 *       Returns products matching the specified criteria.
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: Product ID for single product lookup
 *                 example: "507f1f77bcf86cd799439011"
 *               clientId:
 *                 type: string
 *                 description: Filter by client ID
 *                 example: "611f1f77bcf86cd799439022"
 *               search:
 *                 type: string
 *                 description: Text search across name, description and category
 *                 example: "smartphone"
 *               page:
 *                 type: integer
 *                 description: Page number for pagination
 *                 default: 1
 *                 minimum: 1
 *                 example: 1
 *               limit:
 *                 type: integer
 *                 description: Number of items per page
 *                 default: 10
 *                 minimum: 1
 *                 maximum: 100
 *                 example: 10
 *               minPrice:
 *                 type: number
 *                 description: Minimum product price filter
 *                 example: 100
 *               maxPrice:
 *                 type: number
 *                 description: Maximum product price filter
 *                 example: 500
 *               category:
 *                 type: string
 *                 description: Filter by category name
 *                 example: "Electronics"
 *               urgencyLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Filter by urgency level
 *                 example: "high"
 *               sortField:
 *                 type: string
 *                 enum: [createdAt, productName, totalPrice, urgencyLevel]
 *                 default: "createdAt"
 *                 description: Field to sort by
 *               sortOrder:
 *                 type: string
 *                 enum: [asc, desc]
 *                 default: "desc"
 *                 description: Sort direction
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 description:
 *                   type: string
 *                   example: "Success"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         hasNext:
 *                           type: boolean
 *                           example: true
 *                         hasPrev:
 *                           type: boolean
 *                           example: false
 *                     filters:
 *                       type: object
 *                       description: Applied filters for reference
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: Product not found (when searching by specific ID)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         productName:
 *           type: string
 *           example: "iPhone 13 Pro"
 *         quantity:
 *           type: number
 *           example: 1
 *         productDescription:
 *           type: string
 *           example: "Latest Apple smartphone"
 *         productCategory:
 *           $ref: '#/components/schemas/Category'
 *         categoryName:
 *           type: string
 *           example: "Electronics"
 *         productWeight:
 *           type: number
 *           example: 0.2
 *         productDimensions:
 *           type: string
 *           example: "6.1 x 3 x 0.3 inches"
 *         productPhotos:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *             example: "https://example.com/image.jpg"
 *         destination:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *               example: "New York"
 *             country:
 *               type: string
 *               example: "USA"
 *             town:
 *               type: string
 *               example: "Manhattan"
 *         productFee:
 *           type: number
 *           example: 999.99
 *         productMarkup:
 *           type: number
 *           example: 149.99
 *         totalPrice:
 *           type: number
 *           example: 1149.98
 *         urgencyLevel:
 *           type: string
 *           enum: [low, medium, high]
 *           example: "medium"
 *         client:
 *           $ref: '#/components/schemas/Client'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00Z"
 * 
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         categoryName:
 *           type: string
 *           example: "Electronics"
 * 
 *     Client:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "611f1f77bcf86cd799439022"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john@example.com"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
// Unified POST search endpoint
router.post('/search/', productController.searchProducts);

/**
 * @swagger
 * /api/products/:id:
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
 * /api/products/:id:
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

/**@swagger
 * /api/products/category/:
 *   post:
 *     summary: Create a new Category
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
 *               categoryName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error 
 */

router.post("/category/", authenticateClient, productController.createCategory);

/**
 * **
 * @swagger
 * /api/products/category/:id:
 *   put:
 *     summary: Update a specific category
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the category to be updated
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
  *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.put("/category/:id", authenticateClient, productController.updateCategory);

/**
 * @swagger
 * /products/category/:id:
 *   delete:
 *     summary: Delete a specific Category
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the category to be deleted
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
 
router.delete("/category/:id", authenticateClient, productController.deleteCategory);
/**
 * @swagger
 * /products/category/:
 *   get:
 *     summary: get all Category
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Category fetched successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
 
router.get("/category/", productController.getCategories);

module.exports = router;
