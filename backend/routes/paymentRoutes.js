const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/pay", paymentController.processPayment);
router.post("/release", paymentController.releaseFunds);
router.post("/dispute", paymentController.raiseDispute);
router.post("/dispute/resolve", paymentController.resolveDispute);

module.exports = router;
