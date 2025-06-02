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
  try {
    const userId = req.user.id;
    const { productId, rating, comment } = req.body;

    // Validate inputs
    if (!productId || !rating) {
      return response(res, 400, { message: 'Missing required fields' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return response(res, 400, { message: 'Rating must be an integer between 1 and 5' });
    }
    if (comment && (typeof comment !== 'string' || comment.length > 500)) {
      return response(res, 400, { message: 'Comment must be a string with max 500 characters' });
    }

    // Verify requester is the client
    if (req.user.id !== userId) {
      return response(res, 403, { message: 'Unauthorized: You can only rate as the client' });
    }
    
    // Find the order
    const order = await Order.findOne({ 
      userId, 
      'items.product': productId
     });
    if (!order) {
      return response(res, 404, { message: 'Order not found' });
    }

    // Find the specific item
    const item = order.items.find(item => item.product.toString() === productId);
    if (!item) {
      return response(res, 404, { message: 'Product not found in order' });
    }

    // Check order status
    if (item.deliveryStatus !== 'Delivered' && item.deliveryStatus !== 'Client Confirmed') {
      return response(res, 400, { message: 'Product must be delivered to submit a rating' });
    }

     // Check if already rated
    if (item.travelerRating != null) {
      return response(res, 400, { message: 'You already rated for this product' });
    }

    // Update item rating
    item.travelerRating = rating;
    item.travelerComment = comment || null;
    await order.save();

    // Update traveler's rating
    if (!item.claimedBy) {
      return response(res, 400, { message: 'No traveler assigned to this product' });
    }

    // Update traveler's rating
    const travelerId = item.claimedBy;
    console.log(travelerId);
    const traveler = await Traveler.findById({  travelerId });
    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }

    const currentCount = traveler.earnings.rating.count || 0;
    const currentAverage = traveler.earnings.rating.average || 0;
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    traveler.earnings.rating.average = newAverage;
    traveler.earnings.rating.count = newCount;
    await traveler.save();

    return response(res, 200, {
      message: 'Traveler rated successfully',
      travelerRating: { average: newAverage, count: newCount },
    });
  } catch (err) {
    console.error('Client to traveler rating error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};

exports.travelerToClientRating = async (req, res) => {
  try {
    const travelerInfo = req.user.id;
    const { productId, rating, comment } = req.body;

    // Validate inputs
    if (!productId || !rating) {
      return response(res, 400, { message: 'Missing required fields' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return response(res, 400, { message: 'Rating must be an integer between 1 and 5' });
    }
    if (comment && (typeof comment !== 'string' || comment.length > 500)) {
      return response(res, 400, { message: 'Comment must be a string with max 500 characters' });
    }

    // Verify requester is the traveler
    if (req.user.id !== travelerInfo) {
      return response(res, 403, { message: 'Unauthorized: You can only rate as the traveler' });
    }

    const traveler = await Traveler.findOne({ userId: travelerInfo });
      if (!traveler) {
          return res.status(404).json({ message: 'Traveler profile not found' });
      }
  
    // Find the order
    const order = await Order.findOne({ 
      'items.product': productId, 
      'items.claimedBy': traveler._id 
    });

    if (!order) {
      return response(res, 404, { message: 'Order not found' });
    }

     if (!order) {
      return response(res, 404, { message: 'Order not found' });
    }

    // Find the specific item
    const item = order.items.find(item => 
      item.product.toString() === productId && 
      item.claimedBy.toString() === traveler._id.toString()
    );
    
    if (!item) {
      return response(res, 404, { message: 'Product not found in your deliveries' });
    }

    console.log(item);
    // Check delivery status
    if (item.deliveryStatus !== 'Delivered') {
      return response(res, 400, { message: 'Product must be delivered to submit a rating' });
    }

    // Check if already rated
    if (item.clientRating != null) {
      return response(res, 400, { message: 'Client already rated for this product' });
    }

    // Update item rating
    item.clientRating = rating;
    item.clientComment = comment || null;
    await order.save();

    // Update client's rating
    const client = await User.findById(order.userId);
    if (!client) {
      return response(res, 404, { message: 'Client not found' });
    }

    // Update client's rating
    const currentCount = client.rating.count || 0;
    const currentAverage = client.rating.average || 0;
    const newCount = currentCount + 1;
    const newAverage = ((currentAverage * currentCount) + rating) / newCount;

    client.rating.average = newAverage;
    client.rating.count = newCount;
    await client.save();

    return response(res, 200, {
      message: 'Client rated successfully',
      clientRating: { average: newAverage, count: newCount },
    });
  } catch (err) {
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
      .populate('userId')
      .populate('travelerId');
    console.log(order);

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
    const { travelerId } = req.params;

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(travelerId)) {
      return response(res, 400, { message: 'Invalid userId' });
    }
    
    // Find the traveler
    const traveler = await Traveler.findOne({ _id: travelerId });
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