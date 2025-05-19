const mongoose = require('mongoose');
const Order = require('../models/Order');
const Traveler = require('../models/Traveler');
const User = require('../models/Users');

const response = (res, statusCode, data) => {
  res.status(statusCode).json({
    status: statusCode,
    description: statusCode === 200 ? 'Success' : 'Error',
    success: statusCode === 200,
    data,
  });
};

exports.clientToTravelerRating = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderNumber, userId, travelerId, rating, comment } = req.body;

    // Validate inputs
    if (!orderNumber || !userId || !travelerId || !rating) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Missing required fields' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Rating must be an integer between 1 and 5' });
    }
    if (comment && (typeof comment !== 'string' || comment.length > 500)) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Comment must be a string with max 500 characters' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(travelerId)) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Invalid userId or travelerId' });
    }

    // Verify requester is the client
    if (req.user.userId !== userId) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 403, { message: 'Unauthorized: You can only rate as the client' });
    }

    // Find the order
    const order = await Order.findOne({ orderNumber, userId, travelerId }).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 404, { message: 'Order not found' });
    }

    // Check order status
    if (order.deliveryStatus !== 'Delivered') {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Order must be delivered to submit a rating' });
    }

    // Check if already rated
    if (order.travelerRating != null) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Traveler already rated for this order' });
    }

    // Update order with traveler rating and comment
    order.travelerRating = rating;
    order.travelerComment = comment || null;
    await order.save({ session });

    // Update traveler's rating
    const traveler = await Traveler.findOne({ userId: travelerId }).session(session);
    if (!traveler) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 404, { message: 'Traveler not found' });
    }

    const currentCount = traveler.earnings.rating.count;
    const currentAverage = traveler.earnings.rating.average;
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    traveler.earnings.rating.average = newAverage;
    traveler.earnings.rating.count = newCount;
    await traveler.save({ session });

    await session.commitTransaction();
    session.endSession();

    return response(res, 200, {
      message: 'Traveler rated successfully',
      travelerRating: { average: newAverage, count: newCount },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Client to traveler rating error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};

exports.travelerToClientRating = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderNumber, travelerId, userId, rating, comment } = req.body;

    // Validate inputs
    if (!orderNumber || !travelerId || !userId || !rating) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Missing required fields' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Rating must be an integer between 1 and 5' });
    }
    if (comment && (typeof comment !== 'string' || comment.length > 500)) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Comment must be a string with max 500 characters' });
    }
    if (!mongoose.Types.ObjectId.isValid(travelerId) || !mongoose.Types.ObjectId.isValid(userId)) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Invalid travelerId or userId' });
    }

    // Verify requester is the traveler
    if (req.user.userId !== travelerId) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 403, { message: 'Unauthorized: You can only rate as the traveler' });
    }

    // Find the order
    const order = await Order.findOne({ orderNumber, userId, travelerId }).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 404, { message: 'Order not found' });
    }

    // Check order status
    if (order.deliveryStatus !== 'Delivered') {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Order must be delivered to submit a rating' });
    }

    // Check if already rated
    if (order.clientRating != null) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 400, { message: 'Client already rated for this order' });
    }

    // Update order with client rating and comment
    order.clientRating = rating;
    order.clientComment = comment || null;
    await order.save({ session });

    // Update client's rating
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      session.endSession();
      return response(res, 404, { message: 'Client not found' });
    }

    const currentCount = user.rating.count;
    const currentAverage = user.rating.average;
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    user.rating.average = newAverage;
    user.rating.count = newCount;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return response(res, 200, {
      message: 'Client rated successfully',
      clientRating: { average: newAverage, count: newCount },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Traveler to client rating error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};

exports.getOrderRatings = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    // Validate orderNumber
    if (!orderNumber || !/^ORD-\d{13}-\d+$/.test(orderNumber)) {
      return response(res, 400, { message: 'Invalid order number' });
    }

    // Find the order
    const order = await Order.findOne({ orderNumber })
      .populate('userId', 'email')
      .populate('travelerId', 'email');

    if (!order) {
      return response(res, 404, { message: 'Order not found' });
    }

    // Return ratings
    return response(res, 200, {
      message: 'Order ratings retrieved successfully',
      clientRating: order.clientRating || null,
      travelerRating: order.travelerRating || null,
      clientComment: order.clientComment || null,
      travelerComment: order.travelerComment || null,
    });
  } catch (err) {
    console.error('Get order ratings error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};

exports.getTravelerRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response(res, 400, { message: 'Invalid userId' });
    }

    // Find the traveler
    const traveler = await Traveler.findOne({ userId });
    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }

    // Return traveler ratings
    return response(res, 200, {
      message: 'Traveler ratings retrieved successfully',
      rating: {
        average: traveler.earnings.rating.average || 0,
        count: traveler.earnings.rating.count || 0,
      },
    });
  } catch (err) {
    console.error('Get traveler ratings error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};

exports.getClientRatings = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response(res, 400, { message: 'Invalid userId' });
    }

    // Find the client
    const user = await User.findById(userId);
    if (!user) {
      return response(res, 404, { message: 'Client not found' });
    }

    // Return client ratings
    return response(res, 200, {
      message: 'Client ratings retrieved successfully',
      rating: {
        average: user.rating.average || 0,
        count: user.rating.count || 0,
      },
    });
  } catch (err) {
    console.error('Get client ratings error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};