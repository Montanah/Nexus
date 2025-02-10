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
router.post("/", authenticateClient, upload.array("images", 5), productController.createProduct);
router.get("/", authenticateClient, productController.getClientProducts);
router.get("/:id", authenticateClient, productController.getProductById);
router.put("/:id", authenticateClient, productController.updateProduct);
router.delete("/:id", authenticateClient, productController.deleteProduct);

module.exports = router;
