const express = require('express');
const router = express.Router();
const ratingsController = require('../controllers/ratingsController');
const { authenticateClient } = require("../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: Rating management endpoints
 */
/**
 * @swagger
 * post:
 *   /api/ratings/client-to-traveler:
 *     summary: Rate a traveler
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Traveler rated successfully
 */
router.post('/client-to-traveler', authenticateClient, ratingsController.clientToTravelerRating);

/**
 * @swagger
 * post:
 *   /api/ratings/traveler-to-client:
 *     summary: Rate a client
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               review:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client rated successfully
 */
router.post('/traveler-to-client', authenticateClient, ratingsController.travelerToClientRating);

/**
 * @swagger
 * get:
 *   /api/ratings/orders/{orderNumber}:
 *     summary: Get ratings for an order
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ratings fetched successfully
 */
router.get('/orders/:orderNumber', authenticateClient, ratingsController.getOrderRatings);

/**
 * @swagger
 * get:
 *   /api/ratings/traveler/{userId}:
 *     summary: Get traveler ratings
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Traveler ratings fetched successfully
 */
router.get('/traveler/:travelerId', authenticateClient, ratingsController.getTravelerRatings);

/**
 * @swagger
 * get:
 *   /api/ratings/client/{userId}:
 *     summary: Get client ratings
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client ratings fetched successfully
 */
router.get('/client/:userId', authenticateClient, ratingsController.getClientRatings);

module.exports = router;