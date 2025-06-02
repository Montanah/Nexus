const Product = require("../models/Product");
const Order = require("../models/Order");
const Traveler = require("../models/Traveler");
const { response } = require("../utils/responses");
const mongoose = require("mongoose");



// Get all claimed products for a traveler
exports.getClaimedProducts = async (req, res) => {
  try {
    const userId = req.params.travelerId;

    const travelerid = await Traveler.findOne({ userId: userId });
    if (!travelerid) {
      return response(res, 404, { message: 'Traveler not found' });
    }
    
    const products = await Product.find({ claimedBy: travelerid._id })
    
    return response(res, 200, { message: 'Claimed products fetched successfully', products });
  } catch (error) {
    return response(res, 500, { message: 'Server error' });
  }
};


exports.getTravelerEarnings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let traveler = await Traveler.findOne({ userId });
    
    if (!traveler) {
      // return res.status(404).json({ message: 'Traveler not found' });
      traveler = await Traveler.create({
        userId,
        earnings: {
          totalEarnings: '0.00',
          pendingPayments: '0.00',
          rating: { average: 0, count: 0 },
        },
        history: [],
      });
      console.log('Created new traveler:', traveler);
    }
    res.json({
      success: true,
      totalEarnings: traveler.earnings.totalEarnings,
      pendingPayments: traveler.earnings.pendingPayments,
      rating: traveler.earnings.rating,
    });
  } catch (err) {
    console.error('Get earnings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getTravelerHistory = async (req, res) => {
  try {
    const travelerId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(travelerId)) {
      return response(res, 400, { message: 'Invalid travelerId' });
    }

    const traveler = await Traveler.findOne({ userId: travelerId }).populate({
      path: 'history.orderId',
      populate: { path: 'items.product', select: 'productName totalPrice' },
    });

    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }

    const history = traveler.history.map(entry => ({
      orderId: entry.orderId._id,
      orderNumber: entry.orderId.orderNumber,
      products: entry.orderId.items.map(item => ({
        productId: item.product._id,
        productName: item.product.productName,
        price: item.product.totalPrice,
        quantity: item.quantity,
      })),
      rewardAmount: entry.rewardAmount,
      status: entry.status,
      completedAt: entry.completedAt,
    }));

    return response(res, 200, {
      message: 'Traveler history retrieved successfully',
      history,
    });
  } catch (err) {
    console.error('Get traveler history error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderNumber } = req.params;
  const userId = req.user.id;
  const { status } = req.body;

  try {
    const traveler = await Traveler.findOne({ userId: userId });
    if (!traveler) {
      return res.status(404).json({ message: 'Traveler profile not found' });
    }
    const order = await Order.findOne({ orderNumber: orderNumber });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not assigned to traveler' });
    }
    if (!["Pending", "Assigned", "Shipped", "Delivered", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    order.deliveryStatus = status;
    await order.save();
    return response(res, 200, {
      message: 'Order status updated successfully',
      status: order.deliveryStatus,
      travelerId: traveler._id
    });
  } catch (err) {
    console.error('Update status error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};


exports.getUnassignedOrders = async (req, res) => {
  try {
    const { category, destination, priceMin, priceMax, urgency } = req.query;
    const query = { travelerId: null }; // Only unassigned orders

    if (category) query['product.categoryName'] = category;
    if (destination) {
      const [country, city] = destination.split(',');
      query['product.destination.country'] = country;
      if (city) query['product.destination.city'] = city;
    }
    if (priceMin) query['product.totalPrice'] = { ...query['product.totalPrice'], $gte: Number(priceMin) };
    if (priceMax) query['product.totalPrice'] = { ...query['product.totalPrice'], $lte: Number(priceMax) };
    if (urgency) query['product.urgencyLevel'] = urgency;

    const orders = await Order.find(query)
      .populate('product', 'productName productDescription totalPrice productPhotos destination deliverydate urgencyLevel rewardAmount productMarkup categoryName')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return response(res, 404, 'No orders found for this user');
    }

    return response(res, 200, { "message": 'Orders retrieved successfully', orders: orders });

  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignFulfilment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return response(res, 400, { message: 'Missing required fields' });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return response(res, 404, { message: 'Product not found' });
    }

    if (product.claimedBy) {
      return response(res, 400, { message: 'Product already claimed by another user' });
    }

    const traveler = await Traveler.findOne({ userId: userId });;
    
    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }

    const order = await Order.findOne({
      'items.product': productId,
      'items.claimedBy': null, 
    });

    if (!order) {
      return response(res, 404, { message: 'No unassigned order for this product ' });
    }

    //Assign product and order
    product.claimedBy = traveler._id;
    product.deliveryStatus = 'Assigned';
    await product.save();

    const item = order.items.find(i => i.product.toString() === productId && !i.claimedBy);
    if (item) {
      item.claimedBy = traveler._id;
      item.deliveryStatus = 'Assigned';
    }
    await order.save();

    //Add to traveler history
    traveler.history.push({
      orderId: order._id,
      rewardAmount: product.rewardAmount,
      status: 'Pending'
    });

    await traveler.save();

    return response(res, 200, {
      message: 'Order assigned successfully',
      product: productId,
      travelerId: traveler._id,
    });
  } catch (err) {
    console.error('Assign fulfilment error:', err);
    return response(res, 500, { message: 'Server error' });
  }
}

exports.uploadDeliveryProof = async (req, res) => {
  try {
    const { productId } = req.params;
    const { deliveryProof, mimeType } = req.body;

     if (!/^[A-Za-z0-9+/]+={0,2}$/.test(deliveryProof)) {
      return response(res, 400, 'Invalid base64 format');
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validMimeTypes.includes(mimeType)) {
      return response(res, 400, 'Invalid file type. Only JPEG, PNG, PDF allowed');
    }

    const buffer = Buffer.from(deliveryProof, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      return response(res, 400, { message: 'File size exceeds 5MB limit' });
    }

    const order = await Order.findOne({
      'items.product': productId,
    });

    if (!order) {
      return response(res, 404, { message: 'Order not found for this product' });
    }

    const item = order.items.find(i => i.product.toString() === productId);
    if (!item) {
      return response(res, 404, { message: 'Product not found in order' });
    }

    if (item.deliveryStatus !== 'Client Confirmed') {
      return response(res, 400, { message: 'Product must be in Client Confirmed status to upload proof' });
    }

    //Store
    item.deliveryProof = `data:${mimeType};base64,${deliveryProof}`;
    item.deliveryStatus = 'Complete';
    await order.save();

    const traveler = await Traveler.findOne({ userId: req.user.id });
    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }

    //Add to traveler history
    traveler.history.push({
      orderId: order._id,
      rewardAmount: item.rewardAmount,
      status: 'Complete',
      completedAt: new Date(),
    });

    traveler.earnings.pendingPayments += item.rewardAmount;
    await traveler.save();

    return response(res, 200, {
      message: 'Delivery proof uploaded successfully',
      order: productId,
      proofUrl: item.deliveryProof
    });
  } catch (err) {
    console.error('Upload delivery proof error:', err);
    return response(res, 500, { message: 'Server error' });
  }
}

exports.getTravelersOrders = async (req, res) => {
  const travelerId = req.params.travelerId;

  try {
    const traveler = await Traveler.findById(travelerId);

    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }

    const orders = await Order.find({ travelerId: travelerId });

    if (!orders || orders.length === 0) {
      return response(res, 404, 'No orders found for this user');
    }

    return response(res, 200, { "message": 'Orders retrieved successfully', orders: orders });

  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

exports.uploadDeliveryProofFile = async (req, res) => {
  try {
    const { productId } = req.params;
    const file = req.file;
    const { mimeType } = req.body;

    if (!file) {
      return response(res, 400, { message: 'No file uploaded' });
    }

    const validMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validMimeTypes.includes(file.mimetype)) {
      return response(res, 400, { message: 'Invalid file type. Only JPEG, PNG, PDF allowed' });
    }

    // Convert file to Base64
    const base64String = file.buffer.toString('base64');

    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64String)) {
      return response(res, 400, { message: 'Invalid base64 format' });
    }

    if (file.size > 5 * 1024 * 1024) {
      return response(res, 400, { message: 'File size exceeds 5MB limit' });
    }

    const order = await Order.findOne({
      'items.product': productId,
    });

    if (!order) {
      return response(res, 404, { message: 'Order not found for this product' });
    }

    const item = order.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return response(res, 404, { message: 'Product not found in order' });
    }

    if (item.claimedBy.toString() !== req.user.id) {
      return response(res, 403, { message: 'Unauthorized: Not your delivery' });
    }

    if (item.deliveryStatus !== 'Client Confirmed') {
      return response(res, 400, { message: 'Product must be in Client Confirmed status to upload proof' });
    }

    // Store
    item.deliveryProof = `data:${file.mimetype};base64,${base64String}`;
    item.deliveryStatus = 'Complete';
    await order.save();

    const traveler = await Traveler.findOne({ userId: req.user.id });
    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }

    traveler.history.push({
      orderId: order._id,
      rewardAmount: item.rewardAmount,
      status: 'Complete',
      completedAt: new Date(),
    });

    traveler.earnings.pendingPayments += item.rewardAmount;
    await traveler.save();

    return response(res, 200, {
      message: 'Delivery proof uploaded successfully',
      order: productId,
      proofUrl: item.deliveryProof,
    });
  } catch (err) {
    console.error('Upload delivery proof error:', err);
    return response(res, 500, { message: 'Server error' });
  }
};