const Product = require("../models/Product");
const Users = require("../models/Users");
const { response } = require("../utils/responses");
const Cart = require("../models/Cart");
const Order = require("../models/Order");


/**
 * Adds a product to the user's cart. If the product is already in the cart, 
 * its quantity is updated. If the product does not exist in the cart, it is added.
 * 
 * @param {Object} req - The request object containing user and product details.
 * @param {Object} res - The response object used to send back the appropriate response.
 * 
 * @throws Will send a response with status 404 if the product is not found.
 * @throws Will send a response with status 500 if an error occurs while adding the product to the cart.
 */


exports.addToCart = async (req, res) => {
    try {
        const userID = req.user.id;
        const { productID, quantity } = req.body;

        // Check if the product exists
        const product = await Product.findById(productID);
        if (!product) {
            return response(res, 404, "Product not found");
        }

        // Find the user's cart or create a new one
        let cart = await Cart.findOne({ user: userID });
        if (!cart) {
            cart = new Cart({ user: userID, items: [] });
        }

        // Check if the product is already in the cart
        const existingItem = cart.items.find(item => item.product.toString() === productID);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ product: productID, quantity });
        }

        await cart.save();
        response(res, 200, "Product added to cart", { cart });
    } catch (error) {
        console.error("Error adding to cart:", error);
        response(res, 500, "Error adding to cart", error);
    }
};

exports.getCart = async (req, res) => {
    try {
        const userID = req.user.id;
        const cart = await Cart.findOne({ user: userID }).populate("items.product");

        if (!cart) {
            return response(res, 200, "Cart is empty", { items: [] });
        }

        response(res, 200, "Cart retrieved successfully", { cart });
    } catch (error) {
        console.error("Error fetching cart:", error);
        response(res, 500, "Error fetching cart", error);
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const userID = req.user.id;
        const { productID } = req.body;

        const cart = await Cart.findOne({ user: userID });
        if (!cart) {
            return response(res, 404, "Cart not found");
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productID);
        await cart.save();

        response(res, 200, "Product removed from cart", { cart });
    } catch (error) {
        console.error("Error removing from cart:", error);
        response(res, 500, "Error removing from cart", error);
    }
};

exports.saveForLater = async (req, res) => {
    try {
        const userID = req.user.id;
        const { productID } = req.body;

        const product = await Product.findById(productID);
        if (!product) {
            return response(res, 404, "Product not found");
        }

        let wishlist = await Wishlist.findOne({ user: userID });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userID, items: [] });
        }

        if (!wishlist.items.includes(productID)) {
            wishlist.items.push(productID);
        }

        await wishlist.save();
        response(res, 200, "Product saved for later", { wishlist });
    } catch (error) {
        console.error("Error saving product for later:", error);
        response(res, 500, "Error saving product for later", error);
    }
};

exports.getWishlist = async (req, res) => {
    try {
        const userID = req.user.id;
        const wishlist = await Wishlist.findOne({ user: userID }).populate("items");

        if (!wishlist) {
            return response(res, 200, "No saved items", { items: [] });
        }

        response(res, 200, "Wishlist retrieved successfully", { wishlist });
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        response(res, 500, "Error fetching wishlist", error);
    }
};

exports.checkout = async (req, res) => {
    try {
        const userID = req.user.id;
        const cart = await Cart.findOne({ user: userID }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return response(res, 400, "Cart is empty");
        }

        // Calculate total price
        let totalAmount = 0;
        cart.items.forEach(item => {
            totalAmount += item.quantity * item.product.productFee;
        });

        // Create an order
        const order = new Order({
            user: userID,
            items: cart.items,
            totalAmount,
            status: "Pending",
        });

        await order.save();

        // Clear the cart after checkout
        await Cart.findOneAndDelete({ user: userID });

        response(res, 200, "Checkout successful", { order });
    } catch (error) {
        console.error("Error during checkout:", error);
        response(res, 500, "Error during checkout", error);
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userID = req.user.id;
        const orders = await Order.find({ user: userID });

        response(res, 200, "Orders retrieved successfully", { orders });
    } catch (error) {
        console.error("Error fetching orders:", error);
        response(res, 500, "Error fetching orders", error);
    }
};

