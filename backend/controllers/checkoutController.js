const Order = require('../models/Order');
const Traveler = require('../models/Traveler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');
const { response } = require("../utils/responses");

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        // const { cart } = req.body;

        // if (!userId || !cart || !Array.isArray(cart.items)) {
        //     return response(res, 400, { 
        //         success: false, 
        //         message: 'Invalid request data Invalid cart data' 
        //     });
        // }
        console.log(userId);
        const userCart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!userCart) {
            return response(res, 404, { 
                success: false, 
                message: 'Cart not found' 
            }); 
        }

        // Calculate total amount
        let totalAmount = 0;
        const orderItems = userCart.items.map(item => {
            const productPrice = item.product.totalPrice || 0;
            totalAmount += productPrice * item.quantity;
            return {
                product: item.product._id,
                quantity: item.quantity
            };
        });

        const orderNumber = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`; // Create order number

        // Create new order
        const newOrder = new Order({
            userId,
            orderNumber,
            items: orderItems,
            totalAmount,
            paymentStatus: 'Pending',
            deliveryStatus: 'Pending'
        });

        const savedOrder = await newOrder.save();   // Save the order

        // Clear the user's cart after successful order creation
        await Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } },
            { new: true }
        );

        return response(res, 201, {
            orderNumber: savedOrder.orderNumber,
            order: savedOrder,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return response(res, 400, { 
            message: 'Failed to create order',
            error: error.message 
        });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ userId })
            .populate({
                path: 'items.product',
                select: 'productName productDescription totalPrice productPhotos deliverydate'
            })
            .populate({
                path: 'items.claimedBy',
                populate: {
                    path: 'userId', 
                    select: 'name email'
                }
            })
            .sort({ createdAt: -1 });

        if (!orders || orders.length === 0) {
            return response(res, 404, 'No orders found for this user');
        }

        return response(res, 200, {"message": 'Orders retrieved successfully', orders: orders });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return response(res, 500, {"message": 'Error fetching orders',  "error": error.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderNumber } = req.params;

        if (req.user.id !== userId) {
            return response(res, 403, { message: 'Unauthorized' });
          }

        const order = await Order.findOne({ userId, orderNumber })
            .populate('items.product')
            .populate('travelerId', 'name phone rating');

        if (!order) {
            return response(res, 404, 'Order not found');
        }

        return response(res, 200, {"message": 'Order retrieved successfully',  order });

    } catch (error) {
        console.error('Error fetching order:', error);
        return response(res, 500, {"message": 'Error fetching order', "error": error.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const { paymentStatus } = req.body;
      const { paymentMethod } = req.body;   
  
      if (!['Completed', 'Failed'].includes(paymentStatus)) {
        return response(res, 400, { message: 'Invalid payment status' });
      }
  
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        return response(res, 404, { message: 'Order not found' });
      }
  
      if (req.user.id !== order.userId.toString()) {
        return response(res, 403, { message: 'Unauthorized' });
      }
  
      order.paymentStatus = paymentStatus;
      order.paymentMethod = paymentMethod;
      const updatedOrder = await order.save();
  
      return response(res, 200, { message: 'Payment status updated', order: updatedOrder });
    } catch (error) {
      console.error('Error updating payment status:', error);
      return response(res, 500, { message: 'Error updating payment status', error: error.message });
    }
  };

exports.updateDeliveryStatus = async (req, res) => {
    try {
      const userId = req.user.id;
      const { productId, deliveryStatus } = req.body;

      if (!productId || !deliveryStatus) {
        return response(res, 400, { message: 'Missing productId or deliveryStatus' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return response(res, 404, { message: 'Product not found' });
      }

      const traveler = await Traveler.findOne({ userId });
      if (!traveler) {
        return response(res, 404, { message: 'Traveler not found' });
      }
  
      if (product.claimedBy?.toString() !== traveler._id.toString()) {
        return response(res, 403, { message: 'You are not assigned to this product' });
      }

       // Update product delivery status
      product.deliveryStatus = deliveryStatus;
      await product.save();

      console.log(`Traveler ${userId} confirmed delivery for ${productId}`);

   
      // Find the matching order and item
      const order = await Order.findOne({
        'items.product': productId,
        'items.claimedBy': traveler._id,
      });

      if (!order) {
        return response(res, 404, { message: 'Order not found for this product and traveler' });
      }

      const item = order.items.find(
        i => i.product.toString() === productId && i.claimedBy?.toString() === traveler._id.toString()
      );

      if (item) {
        item.deliveryStatus = deliveryStatus;
      }

      await order.save();

      // Optional: update traveler history
      const historyEntry = traveler.history.find(
        h => h.orderId.toString() === order._id.toString()
      );

      if (historyEntry) {
        if (deliveryStatus === 'traveler_confirmed') {
          historyEntry.status = 'Awaiting Client Confirmation';
        } else if (deliveryStatus === 'client_confirmed') {
          historyEntry.status = 'Completed';
        }
      }

      await traveler.save();

      return response(res, 200, {
        message: 'Delivery status updated successfully',
        productId,
        orderId: order._id,
        deliveryStatus,
      });


    } catch (error) {
      console.error('Error updating delivery status:', error);
      return response(res, 500, { message: 'Error updating delivery status', error: error.message });
    }
  };

exports.updateProductDeliveryStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, deliveryStatus } = req.body;

    if (!productId || !deliveryStatus) {
      return response(res, 400, { message: 'Missing productId or deliveryStatus' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return response(res, 404, { message: 'Product not found' });
    }

    if (product.client?.toString() !== userId.toString()) {
      return response(res, 403, { message: 'You did not order this product' });
    }

      // Update product delivery status
    product.deliveryStatus = deliveryStatus;
    await product.save();

      
    // Find the matching order and item
    const order = await Order.findOne({
      'items.product': productId,
      'userId': userId,
    });

    if (!order) {
      return response(res, 404, { message: 'Order not found for this product and client' });
    }

    const item = order.items.find(i => i.product.toString() === productId);
    let traveler;

    if (item) {
      item.deliveryStatus = deliveryStatus;

    }

    await order.save();

    return response(res, 200, {
      message: 'Delivery status updated successfully',
      productId,
      orderId: order._id,
      deliveryStatus,
    });


  } catch (error) {
    console.error('Error updating delivery status:', error);
    return response(res, 500, { message: 'Error updating delivery status', error: error.message });
  }
};

  exports.cancelOrder = async (req, res) => {
    try {
      const { orderNumber } = req.params;
  
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        return response(res, 404, { message: 'Order not found' });
      }
  
      if (req.user.id !== order.userId.toString()) {
        return response(res, 403, { message: 'Unauthorized' });
      }
  
      if (order.paymentStatus !== 'Pending') {
        return response(res, 400, { message: 'Cannot cancel a paid order' });
      }
  
      await Order.deleteOne({ orderNumber });
      return response(res, 200, { message: 'Order canceled successfully' });
    } catch (error) {
      console.error('Error canceling order:', error);
      return response(res, 500, { message: 'Error canceling order', error: error.message });
    }
  };

  //Assign Traveler
  exports.assignTraveler = async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const { travelerId } = req.body;
  
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        return response(res, 404, { message: 'Order not found' });
      }
  
      order.travelerId = travelerId;
      order.deliveryStatus = 'Assigned';
      const updatedOrder = await order.save();
  
      return response(res, 200, { message: 'Traveler assigned', order: updatedOrder });
    } catch (error) {
      console.error('Error assigning traveler:', error);
      return response(res, 500, { message: 'Error assigning traveler', error: error.message });
    }
  };