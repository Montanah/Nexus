const Product = require("../models/Product");
const Order = require("../models/Order");
const Traveler = require("../models/Traveler");
const { response } = require("../utils/responses");
const mongoose = require("mongoose");

// Search and filter products
exports.getProductsForTravelers = async (req, res) => {
    try {
        const { category, destination, minReward, maxReward, urgency } = req.query;
        let query = {};

        if (category) query.category = category;
        if (destination) query["destination.country"] = destination;
        if (urgency) query.urgencyLevel = urgency;
        if (minReward || maxReward) {
            query.markup = {};
            if (minReward) query.markup.$gte = Number(minReward);
            if (maxReward) query.markup.$lte = Number(maxReward);
        }

        const products = await Product.find(query).select("name category images destination markup urgencyLevel");
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};

// Get product details
exports.getProductDetails = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("client", "name email");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Error fetching product details", error });
    }
};


// Claim a product
exports.claimProduct = async (req, res) => {
    try {
        const travelerId = req.user.id;
        const product = await Product.findById(req.body.productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.claimedBy) {
            return res.status(400).json({ message: "Product already claimed by another traveler" });
        }

        console.log(`Traveler ${travelerId} claimed product ${product._id}`);

        product.claimedBy = travelerId;
        await product.save();

        // Create a notification for the client
        await Notification.create({
            recipient: product.client._id,
            message: `Your product "${product.name}" has been claimed by a traveler.`,
            type: "claim"
        });

        res.status(200).json({ 
          message: "Product claimed successfully", 
          product: {
            ...product._doc,
            assignedTraveler: product.claimedBy
          }
        });
    } catch (error) {
        res.status(500).json({ message: "Error claiming product", error });
    }
};

// Get all claimed products for a traveler
exports.getClaimedProducts = async (req, res) => {
    try {
        const travelerId  = req.user.id;
        const products = await Product.find({ claimedBy: travelerId })
            .select("name category destination images isDelivered");

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching claimed products", error });
    }
};

// Mark a product as delivered
exports.markAsDelivered = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (!product.claimedBy) {
            return res.status(400).json({ message: "This product has not been claimed yet" });
        }

        product.isDelivered = true;
        await product.save();

         // Create a notification for the client
         await Notification.create({
            recipient: product.client._id,
            message: `Your product "${product.name}" has been successfully delivered.`,
            type: "delivery"
        });

        res.status(200).json({ message: "Product marked as delivered", product });
    } catch (error) {
        res.status(500).json({ message: "Error updating product status", error });
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
    const { travelerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(travelerId)) {
      return response(res, 400, { message: 'Invalid travelerId' });
    }

    // Verify requester
    if (req.user.userId !== travelerId) {
      return response(res, 403, { message: 'Unauthorized: You can only view your own history' });
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
    const { travelerId, status } = req.body;
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber, travelerId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found or not assigned to traveler' });
    }
    order.status = status;
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUnassignedOrders = async (req, res) => {
  try {
    const { category, destination, priceMin, priceMax, urgency } = req.query;
    const query = { travelerId: null }; // Only unassigned orders

    if (category) query['items.product.categoryName'] = category;
    if (destination) {
      const [country, city] = destination.split(',');
      query['items.product.destination.country'] = country;
      if (city) query['items.product.destination.city'] = city;
    }
    if (priceMin) query['items.product.totalPrice'] = { ...query['items.product.totalPrice'], $gte: Number(priceMin) };
    if (priceMax) query['items.product.totalPrice'] = { ...query['items.product.totalPrice'], $lte: Number(priceMax) };
    if (urgency) query['items.product.urgencyLevel'] = urgency;

    const orders = await Order.find(query)
      .populate('items.product', 'productName productDescription totalPrice productPhotos destination deliverydate urgencyLevel rewardAmount productMarkup categoryName')
      .populate('travelerId', 'name email')
      .sort({ createdAt: -1 }); 

    if (!orders || orders.length === 0) {
      return response(res, 404, 'No orders found for this user');
    }

    return response(res, 200, {"message": 'Orders retrieved successfully', orders: orders });

  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignFulfilment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {productId} = req.body;

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
    console.log(traveler);

    if (!traveler) {
      return response(res, 404, { message: 'Traveler not found' });
    }
    
    const order = await Order.findOne({
      'items.product': productId,
      travelerId: null
     });
    if (!order) {
      return response(res, 404, { message:'No unassigned order for this product '});
    }

    //Assign product and order
    product.claimedBy = traveler._id;
    order.travelerId = traveler._id;
    order.deliveryStatus = 'Assigned';

    await product.save();
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
      order: order._id,
    });
  } catch (err) {
    console.error('Assign fulfilment error:', err);
    return response(res, 500, { message: 'Server error' });
  }
}

exports.uploadDeliveryProof = async (req, res) => {
  try {
    const { orderId, deliveryProof } = req.body;

    if (!orderId || !deliveryProof) {
      return response(res, 400, { message: 'Missing orderId or deliveryProof' });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return response(res, 400, { message: 'Invalid orderId' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return response(res, 404, { message: 'Order not found' });
    }

    if (req.user.userId !== order.travelerId?.toString()) {
      return response(res, 403, { message: 'Unauthorized: You can only upload delivery proof for your own orders' });
    }

    //Store
    order.deliveryProof = deliveryProof;
    await order.save();

    return response(res, 200, { 
      message: 'Delivery proof uploaded successfully',
      order: orderId});
  } catch (err) {
    console.error('Upload delivery proof error:', err);
    return response(res, 500, { message: 'Server error' });
  }
}