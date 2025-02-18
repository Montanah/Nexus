const Product = require("../models/Product");
const Users = require("../models/Users");

//create a new product listing
exports.createProduct = async (req, res) => {
    try {
        const { productName, productDescription, productCategory, productWeight, productDimensions, destination, productFee, shippingRestrictions, urgencyLevel } = req.body;
        
        const clientID = req.user.id;

        //check if exists
        const client = await Users.findById(clientID);
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Validate destination
        if (!destination || !destination.city || !destination.country) {
            return res.status(400).json({ message: "Invalid destination data" });
        }
        //validate image upload
        // if (!req.files || req.files.length === 0) {
        //     return res.status(400).json({ message: "Product images are required" });
        // }
        const imageUrls = req.files && req.files.length > 0 ? req.files.map(file => file.path) : [];
    
        //const imageUrls = req.files.map(file => file.path);

        // Calculate pricing
        const productMarkup = productFee * 0.15;
        const totalPrice = productFee + productMarkup;
 
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

        console.log("Saving Product:", newProduct);

        await newProduct.save();
        res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ message: "Error creating product", error });
    }
    
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate("client", "name email");
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ message: "Error fetching products", error});
    }
}

// Get all products for a client
exports.getClientProducts = async (req, res) => {
    try {
        const clientId = req.params.userid;
        // console.log("Client ID:", clientId); 
        const products = await Product.find({ client: clientId });
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error("Error", error);
        res.status(500).json({ message: "Error fetching products", error });
    }
};


// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        //console.log("Product ID:", req.params.productId);

        const product = await Product.findById(req.params.productId).populate("client", "name email");
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
        const { productName, productCategory, productDescription, productWeight, productDimensions, destination, productFee,  shippingRestrictions, urgencyLevel } = req.body;
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
        console.error("Error updating product:", error);
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
