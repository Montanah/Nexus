const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticateClient } = require("../middlewares/authMiddleware");

router.post("/pay", authenticateClient, paymentController.processPayment);
router.post("/release", authenticateClient, paymentController.releaseFunds);
router.post("/dispute", authenticateClient, paymentController.raiseDispute);
router.post("/dispute/resolve", authenticateClient, paymentController.resolveDispute);

module.exports = router;
