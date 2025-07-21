const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { 
    authenticateAdmin, 
    requireSuperAdmin, 
    requireResourceAccess,
    rateLimitLogin,
    recordLoginAttempt
} = require("../middlewares/adminMiddleware");

const paymentController = require("../controllers/paymentController");

/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The unique identifier for the admin
 *           example: 12345
 *         name:
 *           type: string
 *           description: The admin's name
 *           example: John Doe
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address
 *           example: admin@example.com
 *         role:
 *           type: string
 *           enum: [admin, superadmin]
 *           description: The admin's role
 *           example: superadmin
 *         permissions:
 *           type: array
 *           description: List of permissions assigned to the admin
 *           items:
 *             type: string
 *             enum:
 *               - users.read
 *               - users.edit
 *               - products.read
 *               - products.edit
 *               - orders.read
 *               - orders.edit
 *               - travelers.read
 *               - travelers.edit
 *               - transactions.read
 *               - disputes.read
 *               - disputes.edit
 *               - exports.read
 *               - admins.read
 *               - admins.edit
 *               - all
 *           example: ["users.read", "users.edit"]
 *         isActive:
 *           type: boolean
 *           description: Indicates if the admin account is active
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: The timestamp of the admin's last login
 *           example: 2025-07-21T12:19:00Z
 *         createdBy:
 *           type: string
 *           description: The ID of the admin who created this admin
 *           example: 67890
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the admin was created
 *           example: 2025-07-21T12:00:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the admin was last updated
 *           example: 2025-07-21T12:19:00Z
 *
 *     AdminLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address
 *           example: admin@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: The admin's password
 *           example: Password123!
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the request was successful
 *           example: false
 *         message:
 *           type: string
 *           description: The error message
 *           example: Unauthorized access
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for admin authentication
 *
 * tags:
 *   - name: Admins
 *     description: Admin management and authentication endpoints
 */

// Admin Authentication Routes (No authentication required)
router.post("/login", rateLimitLogin, recordLoginAttempt, adminController.adminLogin);

// Admin Management Routes (Superadmin only)
/**
 * @swagger
 * /api/admins/create:
 *   post:
 *     summary: Create a new admin
 *     tags: [Admins]
 *     description: Create a new admin (requires superadmin role)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreateRequest'
 *     responses:
 *       '201':
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       '403':
 *         description: Forbidden (requires superadmin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/create", authenticateAdmin, requireSuperAdmin, adminController.createAdmin);

/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all admins
 *     tags: [Admins]
 *     description: Retrieve a list of all admins (requires superadmin role)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of admins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 admins:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 *       '403':
 *         description: Forbidden (requires superadmin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/admins", authenticateAdmin, requireSuperAdmin, adminController.getAllAdmins);
/**
 * @swagger
 * /api/admin/admins/{adminId}:
 *   put:
 *     summary: Update admin permissions
 *     tags: [Admins]
 *     description: Update permissions for a specific admin (requires superadmin role)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the admin to update
 *         example: 12345
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdatePermissionsRequest'
 *     responses:
 *       '200':
 *         description: Admin permissions updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       '403':
 *         description: Forbidden (requires superadmin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete an admin
 *     tags: [Admins]
 *     description: Delete a specific admin (requires superadmin role)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the admin to delete
 *         example: 12345
 *     responses:
 *       '200':
 *         description: Admin deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin deleted successfully
 *       '403':
 *         description: Forbidden (requires superadmin role)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '404':
 *         description: Admin not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.put("/admins/:adminId", authenticateAdmin, requireSuperAdmin, adminController.updateAdminPermissions);
router.delete("/admins/:adminId", authenticateAdmin, requireSuperAdmin, adminController.deleteAdmin);

// Admin Profile Routes (All authenticated admins)
/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admins]
 *     description: Retrieve the currently logged-in admin's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Admin profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update admin profile
 *     tags: [Admins]
 *     description: Update the profile information of the currently logged-in admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUpdateProfileRequest'
 *     responses:
 *       '200':
 *         description: Admin profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 admin:
 *                   $ref: '#/components/schemas/Admin'
 *       '400':
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [Admins]
 *     description: Logs out the currently logged-in admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Admin logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin logged out successfully
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get("/profile", authenticateAdmin, adminController.getAdminProfile);
router.put("/profile", authenticateAdmin, adminController.updateAdminProfile);
router.post("/logout", authenticateAdmin, adminController.adminLogout);

// Data Access Routes (With permission checks)
/**
 * @swagger
 * /api/admins/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admins]
 *     description: Retrieve a list of all users (requires users.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of users
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/users", 
    authenticateAdmin, 
    requireResourceAccess('users', 'read'), 
    adminController.getAllUsers
);

/**
 * @swagger
 * /api/admins/products:
 *   get:
 *     summary: Get all products
 *     tags: [Admins]
 *     description: Retrieve a list of all products (requires products.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of products
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/products", 
    authenticateAdmin, 
    requireResourceAccess('products', 'read'), 
    adminController.getAllProducts
);

/**
 * @swagger
 * /api/admins/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admins]
 *     description: Retrieve a list of all orders (requires orders.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of orders
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/orders", 
    authenticateAdmin, 
    requireResourceAccess('orders', 'read'), 
    adminController.getAllOrders
);

/**
 * @swagger
 * /api/admins/travelers:
 *   get:
 *     summary: Get all travelers
 *     tags: [Admins]
 *     description: Retrieve a list of all travelers (requires travelers.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of travelers
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/travelers", 
    authenticateAdmin, 
    requireResourceAccess('travelers', 'read'), 
    adminController.getAllTravelers
);
// Transaction and Dispute Routes
/**
 * @swagger
 * /api/admins/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Admins]
 *     description: Retrieve a list of all transactions (requires transactions.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of transactions
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/transactions", 
    authenticateAdmin, 
    requireResourceAccess('transactions', 'read'), 
    adminController.getTransactionHistory
);

/**
 * @swagger
 * /api/admins/disputes:
 *   get:
 *     summary: Get all disputes
 *     tags: [Admins]
 *     description: Retrieve a list of all disputes (requires disputes.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of disputes
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/disputes", 
    authenticateAdmin, 
    requireResourceAccess('disputes', 'read'), 
    adminController.getDisputes
);

// Export Routes
/**
 * @swagger
 * /api/admins/export/transactions:
 *   get:
 *     summary: Export transaction history
 *     tags: [Admins]
 *     description: Export transactions data (requires exports.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Transaction export file
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/export/transactions", 
    authenticateAdmin, 
    requireResourceAccess('exports', 'read'), 
    adminController.exportTransactions
);

/**
 * @swagger
 * /api/admins/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Admins]
 *     description: Retrieve a list of all payments (requires payments.read permission)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: A list of payments
 *       '403':
 *         description: Forbidden - insufficient permissions
 */
router.get("/payments", 
    authenticateAdmin, 
    requireResourceAccess('payments', 'read'), 
    adminController.getPayments
);

/**
 * @swagger
 * /api/admins/user/{id}:
 *   get:
 *     summary: Get user details
 *     tags: [Admins]
 *     description: Retrieve detailed info for a specific user (requires users.read permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       '200':
 *         description: Detailed user info
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '404':
 *         description: User not found
 */
router.get("/user/:id",
    authenticateAdmin,
    requireResourceAccess('users', 'read'),
    adminController.getUserDetails
);

/**
 * @swagger
 * /api/admins/traveler/{id}:
 *   get:
 *     summary: Get traveler by ID
 *     tags: [Admins]
 *     description: Retrieve detailed info for a specific traveler (requires travelers.read permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the traveler
 *     responses:
 *       '200':
 *         description: Traveler details
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '404':
 *         description: Traveler not found
 */
router.get("/traveler/:id",
    authenticateAdmin,
    requireResourceAccess('travelers', 'read'),
    adminController.getTravelerById
);

// Individual Resource Routes
/**
 * @swagger
 * /api/admins/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admins]
 *     description: Retrieve a specific user by ID (requires users.read permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user
 *     responses:
 *       '200':
 *         description: User data
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '404':
 *         description: User not found
 */
router.get("/users/:id", 
    authenticateAdmin, 
    requireResourceAccess('users', 'read'), 
    adminController.getUserById
);

/**
 * @swagger
 * /api/admins/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Admins]
 *     description: Retrieve a specific product by ID (requires products.read permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     responses:
 *       '200':
 *         description: Product data
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '404':
 *         description: Product not found
 */
router.get("/products/:id", 
    authenticateAdmin, 
    requireResourceAccess('products', 'read'), 
    adminController.getProductById
);

/**
 * @swagger
 * /api/admins/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Admins]
 *     description: Retrieve a specific order by ID (requires orders.read permission)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *     responses:
 *       '200':
 *         description: Order data
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '404':
 *         description: Order not found
 */
router.get("/orders/:id", 
    authenticateAdmin, 
    requireResourceAccess('orders', 'read'), 
    adminController.getOrderById
);

// routes/paymentRoutes.js
/**
 * @swagger
 * /api/admins/pay:
 *   post:
 *     summary: Process a payment
 *     tags: [Admins]
 *     description: Admin initiates a payment (requires payments.create permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentRequest'
 *     responses:
 *       '200':
 *         description: Payment processed successfully
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '500':
 *         description: Internal server error
 */
router.post("/pay", authenticateAdmin, requireResourceAccess('payments', 'create'), paymentController.processPayment);

/**
 * @swagger
 * /api/admins/release:
 *   post:
 *     summary: Release payment funds
 *     tags: [Admins]
 *     description: Admin releases held payment funds (requires payments.update permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReleaseRequest'
 *     responses:
 *       '200':
 *         description: Funds released
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '500':
 *         description: Internal server error
 */
router.post("/release", authenticateAdmin, requireResourceAccess('payments', 'update'), paymentController.releaseFunds);

/**
 * @swagger
 * /api/admins/dispute:
 *   post:
 *     summary: Raise a dispute
 *     tags: [Admins]
 *     description: Admin raises a payment-related dispute (requires disputes.update permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisputeRequest'
 *     responses:
 *       '200':
 *         description: Dispute raised
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '500':
 *         description: Internal server error
 */
router.post("/dispute", authenticateAdmin, requireResourceAccess('disputes', 'update'), paymentController.raiseDispute);

/**
 * @swagger
 * /api/admins/dispute/resolve:
 *   post:
 *     summary: Resolve a dispute
 *     tags: [Admins]
 *     description: Admin resolves an existing dispute (requires disputes.update permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisputeResolutionRequest'
 *     responses:
 *       '200':
 *         description: Dispute resolved
 *       '403':
 *         description: Forbidden - insufficient permissions
 *       '500':
 *         description: Internal server error
 */
router.post("/dispute/resolve", requireResourceAccess('disputes', 'update'), authenticateAdmin, paymentController.resolveDispute);

module.exports = router;