const Product = require("../models/Product");
const Client = require("../models/Client");

//create a new product listing
exports.createProduct = async (req, res) => {
    try {
        const { productName, productDescription, productCategory, productWeight, productDimensions, destination, productFee, shippingRestrictions, urgencyLevel } = req.body;
        
        const clientID = req.user.id;

        //check if exists
        const client = await Client.findById(clientID);
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        //validate image upload
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "Product images are required" });
        }
        const imageUrls = req.files.map(file => file.path);

        // Calculate pricing
        const productMarkup = productFee * 0.15;
        const totalPrice = productFee + markup;
 
        const newProduct = new Product({ 
            client:clientID, 
            productName, 
            productDescription, 
            productCategory, 
            productWeight, 
            productDimensions, 
            productImage: imageUrls,
            destination,
            productFee,
            shippingRestrictions,
            totalPrice,
            productMarkup,
            urgencyLevel,
        });

        await newProduct.save();
        res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
        res.status(500).json({ message: "Error creating product", error });
    }
};

// Get all products for a client
exports.getClientProducts = async (req, res) => {
    try {
        const clientId = req.user.id;
        const products = await Product.find({ client: clientId });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Error fetching products", error });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate("client", "name email");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Error fetching product", error });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { productName, productCategory, productDescription, productWeight, productDimensions, productFee,  shippingRestrictions, urgencyLevel } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Update fields
        product.productName = productName || product.productName;
        product.productDescription = productDescription || product.productDescription;
        product.productCategory = productCategory || product.productCategory;
        product.productWeight = productWeight || product.productWeight;
        product.productDimensions = productDimensions || product.productDimensions;
        product.destination = destination || product.destination;
        product.shippingRestrictions = shippingRestrictions || product.shippingRestrictions;
        product.productFee = productFee || product.productFee;
        product.productMarkup = product.productFee * 0.15;
        product.totalPrice = product.productFee + product.productMarkup;
        product.urgencyLevel = urgencyLevel || product.urgencyLevel;

        await product.save();
        res.status(200).json({ message: "Product updated successfully", product });
    } catch (error) {
        res.status(500).json({ message: "Error updating product", error });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        await product.deleteOne();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product", error });
    }
};
