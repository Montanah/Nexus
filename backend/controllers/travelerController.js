const Product = require("../models/Product");

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
        const { travelerId } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        if (product.claimedBy) {
            return res.status(400).json({ message: "Product already claimed by another traveler" });
        }

        product.claimedBy = travelerId;
        await product.save();

        // Create a notification for the client
        await Notification.create({
            recipient: product.client._id,
            message: `Your product "${product.name}" has been claimed by a traveler.`,
            type: "claim"
        });

        res.status(200).json({ message: "Product claimed successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Error claiming product", error });
    }
};

// Get all claimed products for a traveler
exports.getClaimedProducts = async (req, res) => {
    try {
        const { travelerId } = req.params;
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
