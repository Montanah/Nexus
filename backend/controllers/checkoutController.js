const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');
const { response } = require("../utils/responses");

exports.createOrder = async (req, res) => {
    try {
        const { userId, cart } = req.body;

        if (!userId || !cart || !Array.isArray(cart.items)) {
            return response(res, 400, { 
                success: false, 
                message: 'Invalid request data' 
            });
        }

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
        const { userId } = req.params;

        // if (!mongoose.Types.ObjectId.isValid(userId)) {
        //     return response(res, 400, 'Invalid user ID');
        // }

        const orders = await Order.find({ userId })
            .populate('items.product', 'productName productDescription totalPrice')
            .populate('travelerId', 'name email')
            .sort({ createdAt: -1 }); 

        if (!orders || orders.length === 0) {
            return response(res, 404, 'No orders found for this user');
        }

        return response(res, 200, {"message": 'Orders retrieved successfully', orders });

    } catch (error) {
        console.error('Error fetching orders:', error);
        return response(res, 500, {"message": 'Error fetching orders',  "error": error.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { userId, orderNumber } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId) || !orderNumber) {
            return response(res, 400, 'Invalid user ID or order number');
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