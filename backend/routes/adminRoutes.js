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

// Admin Authentication Routes (No authentication required)
router.post("/login", rateLimitLogin, recordLoginAttempt, adminController.adminLogin);

// Admin Management Routes (Superadmin only)
router.post("/create", authenticateAdmin, requireSuperAdmin, adminController.createAdmin);
router.get("/admins", authenticateAdmin, requireSuperAdmin, adminController.getAllAdmins);
router.put("/admins/:adminId", authenticateAdmin, requireSuperAdmin, adminController.updateAdminPermissions);
router.delete("/admins/:adminId", authenticateAdmin, requireSuperAdmin, adminController.deleteAdmin);

// Admin Profile Routes (All authenticated admins)
router.get("/profile", authenticateAdmin, adminController.getAdminProfile);
router.put("/profile", authenticateAdmin, adminController.updateAdminProfile);
router.post("/logout", authenticateAdmin, adminController.adminLogout);

// Data Access Routes (With permission checks)
router.get("/users", 
    authenticateAdmin, 
    requireResourceAccess('users', 'read'), 
    adminController.getAllUsers
);

router.get("/products", 
    authenticateAdmin, 
    requireResourceAccess('products', 'read'), 
    adminController.getAllProducts
);

router.get("/orders", 
    authenticateAdmin, 
    requireResourceAccess('orders', 'read'), 
    adminController.getAllOrders
);

router.get("/travelers", 
    authenticateAdmin, 
    requireResourceAccess('travelers', 'read'), 
    adminController.getAllTravelers
);
// Transaction and Dispute Routes
router.get("/transactions", 
    authenticateAdmin, 
    requireResourceAccess('transactions', 'read'), 
    adminController.getTransactionHistory
);

router.get("/disputes", 
    authenticateAdmin, 
    requireResourceAccess('disputes', 'read'), 
    adminController.getDisputes
);

// Export Routes
router.get("/export/transactions", 
    authenticateAdmin, 
    requireResourceAccess('exports', 'read'), 
    adminController.exportTransactions
);

router.get("/payments", 
    authenticateAdmin, 
    requireResourceAccess('payments', 'read'), 
    adminController.getPayments
);

router.get("/user/:id",
    authenticateAdmin,
    requireResourceAccess('users', 'read'),
    adminController.getUserDetails
);

router.get("/traveler/:id",
    authenticateAdmin,
    requireResourceAccess('travelers', 'read'),
    adminController.getTravelerById
);

// Individual Resource Routes
router.get("/users/:id", 
    authenticateAdmin, 
    requireResourceAccess('users', 'read'), 
    adminController.getUserById
);

router.get("/products/:id", 
    authenticateAdmin, 
    requireResourceAccess('products', 'read'), 
    adminController.getProductById
);

router.get("/orders/:id", 
    authenticateAdmin, 
    requireResourceAccess('orders', 'read'), 
    adminController.getOrderById
);

// routes/paymentRoutes.js
router.post("/pay", authenticateAdmin, requireResourceAccess('payments', 'create'), paymentController.processPayment);
router.post("/release", authenticateAdmin, requireResourceAccess('payments', 'update'), paymentController.releaseFunds);
router.post("/dispute", authenticateAdmin, requireResourceAccess('disputes', 'update'), paymentController.raiseDispute);
router.post("/dispute/resolve", requireResourceAccess('disputes', 'update'), authenticateAdmin, paymentController.resolveDispute);

module.exports = router;