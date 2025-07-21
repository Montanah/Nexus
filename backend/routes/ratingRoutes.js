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
 * /api/ratings/client-to-traveler:
 *   post:
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
 * /api/ratings/traveler-to-client:
 *   post:
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
 * /api/ratings/orders/{orderNumber}:
 *   get:
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
 * /api/ratings/traveler/{userId}:
 *   get:
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
 * /api/ratings/client/{userId}:
 *   get:
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