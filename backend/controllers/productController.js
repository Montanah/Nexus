const Product = require("../models/Product");
const Users = require("../models/Users");
const Cart = require("../models/Cart");
const Category = require("../models/Category");
const { response } = require("../utils/responses");

//create a new product listing
exports.createProduct = async (req, res) => {
    try {
        const { productName, quantity, productDescription, productCategory, productWeight, productDimensions, destination, productFee, shippingRestrictions, urgencyLevel } = req.body;
        
        const clientID = req.user.id;

        //check if exists
        const client = await Users.findById(clientID);
        if (!client) {
            return response(res, 404, "Client not found"); 
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
            quantity,
            productDescription, 
            productCategory, 
            productWeight, 
            productDimensions, 
            productPhotos: imageUrls,
            destination,
            productFee,
            shippingRestrictions,
            totalPrice,
            productMarkup,
            urgencyLevel,
        });

        console.log("Saving Product:", newProduct);

        await newProduct.save();
        response(res, 201, "Product created successfully", { product: newProduct }); //res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (error) {
        console.error("Error creating product:", error);
        response(res, 500, "Error creating product", error);
        //res.status(500).json({ message: "Error creating product", error });
    }
    
};

exports.createProductAndAddToCart = async (req, res) => {
    try {
        // 1. Destructure and validate input
        const { 
            productName, 
            quantity, 
            productDescription, 
            productCategory, 
            productWeight, 
            productDimensions, 
            destination, 
            deliverydate,
            productFee, 
            shippingRestrictions, 
            urgencyLevel 
        } = req.body;

        if (!productName || !quantity || !productDescription || !productCategory || !productFee || !deliverydate) {
            return response(res, 400, "Missing required fields: productName, quantity, productDescription, productCategory, productFee, deliverydate are required");
        }

        if (!destination || !destination.city || !destination.country || !destination.state) {
            return response(res, 400, "Invalid destination data: city, country, and state are required");
        }

        const clientID = req.user.id;

        const client = await Users.findById(clientID);
        if (!client) {
            return response(res, 404, "Client not found");
        }

        const existingProduct = await Product.findOne({ 
            productName,
            client: clientID
        });
        if (existingProduct) {
            return response(res, 400, "Product already exists for this user");
        }

        const category = await Category.findById(productCategory);
        if (!category) {
            return response(res, 400, "Invalid product category");
        }

        const imageUrls = req.files?.map(file => file.path) || [];

        const parsedWeight = productWeight ? Number(productWeight) : null;
        if (productWeight && isNaN(parsedWeight)) {
            return response(res, 400, "Invalid productWeight: must be a number");
        }
        const parsedQuantity = Number(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return response(res, 400, "Invalid quantity: must be a positive number");
        }
        const parsedProductFee = Number(productFee);
        if (isNaN(parsedProductFee) || parsedProductFee <= 0) {
            return response(res, 400, "Invalid productFee: must be a positive number");
        }

        let newProduct;

        try {
            newProduct = new Product({
                client: clientID,
                productName,
                quantity: parsedQuantity,
                productDescription,
                productCategory: category._id,
                categoryName: category.categoryName,
                productWeight: parsedWeight,
                productDimensions: productDimensions || null,
                productPhotos: imageUrls,
                destination: {
                    city: destination.city,
                    country: destination.country,
                    state: destination.state,
                },
                deliverydate: new Date(deliverydate),
                productFee: parsedProductFee,
                shippingRestrictions: shippingRestrictions || "",
                urgencyLevel: urgencyLevel || "medium",
            });

            await newProduct.save();
        } catch (saveError) {
            console.error("Product save error:", saveError);
            return response(res, 400, "Failed to save product", {
                error: saveError.message,
                errors: saveError.errors
            });
        }

        try {
            let cart = await Cart.findOne({ user: clientID }) || 
                      new Cart({ user: clientID, items: [] });

            const existingItem = cart.items.find(item => 
                item.product.toString() === newProduct._id.toString());

            if (existingItem) {
                existingItem.quantity += Number(quantity);
            } else {
                cart.items.push({
                    product: newProduct._id,
                    quantity: Number(quantity)
                });
            }

            await cart.save();
        } catch (cartError) {
            await Product.deleteOne({ _id: newProduct._id });
            console.error("Cart save error:", cartError);
            return response(res, 500, "Product created but failed to add to cart", {
                productId: newProduct._id,
                error: cartError.message
            });
        }
        console.log(newProduct);
        response(res, 201, { message: "Product created and added to cart successfully",
            product: newProduct, 
            cart: await Cart.findOne({ user: clientID }).populate('items.product', 'productName') }
         );


    } catch (error) {
        console.error("System error:", error);
        response(res, 500, "System error during product creation", {
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

exports.searchProducts = async (req, res) => {
    try {
        const {id, clientId, search, page = 1, limit = 10,  minPrice,
            maxPrice, category, urgencyLevel, sortField = 'createdAt', sortOrder = 'desc' } = req.body;

        const query = {}

        if (id) {
            query._id = id;
        }

        if (clientId) {
            query.client = clientId;
        }

        if (search) {
            query.$or = [
                { productName: { $regex: search, $options: 'i' } },
                { productDescription: { $regex: search, $options: 'i' } },
                { categoryName: { $regex: search, $options: 'i' } }
            ];
        }

        if (minPrice || maxPrice) {
            query.totalPrice = {};
            if (minPrice) query.totalPrice.$gte = Number(minPrice);
            if (maxPrice) query.totalPrice.$lte = Number(maxPrice);
        }

        if (category) query.categoryName = category;

        if (urgencyLevel) query.urgencyLevel = urgencyLevel;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            populate: [
                { path: 'client', select: 'name email' },
                { path: 'productCategory', select: 'categoryName' }
            ],
            sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 }
        };

        const result = await Product.paginate(query, options);

        response(res, 200, { 
            message:"Products fetched successfully", 
            products: result.docs,
            pagination: {
                total: result.totalDocs,
                pages: result.totalPages,
                page: result.page,
                limit: result.limit,
                hasNext: result.hasNextPage,
                hasPrev: result.hasPrevPage
            },
            filters: req.body
         });
    } catch (error) {
        console.error("Error", error);
        response(res, 500, { message: "Error fetching products", error: error.message });
        }
}
// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { productName, productCategory, productDescription, productWeight, productDimensions,  deliverydate, destination, productFee,  shippingRestrictions, urgencyLevel } = req.body;
        const product = await Product.findById(req.params.id);

        if (!product) {
            response(res, 404, "Product not found");
        }

        // Update fields
        product.productName = productName || product.productName;
        product.productDescription = productDescription || product.productDescription;
        product.productCategory = productCategory || product.productCategory;
        product.productWeight = productWeight || product.productWeight;
        product.productDimensions = productDimensions || product.productDimensions;
        product.destination = destination || product.destination;
        product.deliverydate = deliverydate || product. deliverydate;
        product.shippingRestrictions = shippingRestrictions || product.shippingRestrictions;
        product.productFee = productFee || product.productFee;
        product.productMarkup = product.productFee * 0.15;
        product.totalPrice = product.productFee + product.productMarkup;
        product.urgencyLevel = urgencyLevel || product.urgencyLevel;

        await product.save();

        response(res, 200, {"message": "Product updated successfully", product });
       
    } catch (error) {
        console.error("Error updating product:", error);

        response(res, 500, {"message":"Error updating product", "error": error });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {

            response(res, 404, "Product not found");
           
        }

        await product.deleteOne();

        response(res, 200, "Product deleted successfully");
       
    } catch (error) {

        response(res, 500, "Error deleting product", error);
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;

        const existingCategory = await Category.findOne({ categoryName });
        if (existingCategory) {
            return response(res, 400, "Category already exists");
        }

        const newCategory = new Category({ categoryName });
        await newCategory.save();    

        console.log(newCategory);  
        return response(res, 201, {"message": "Category created successfully", category: newCategory});
    
    } catch (error) {
        console.log(error);
        return response(res, 500, {"message": "Error creating category", error: error.message });
    }
}

exports.updateCategory = async (req, res) => {
    try {
        const { categoryName } = req.body;
        const category = await Category.findById(req.params.id);
        if (!category) {
            return response(res, 404, "Category not found");
        }
        category.categoryName = categoryName || category.categoryName;

        await category.save();
        return response(res, 200, {"message": "Category updated successfully", category });
    } catch (error) {
        return response(res, 500, "Error updating category", error);
    }
}

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        return response(res, 200, {"message": "Categories fetched successfully", categories });
    } catch (error) {
        return response(res, 500, "Error fetching categories", error);
    }
}
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return response(res, 404, "Category not found");
        }
        await category.deleteOne();
        return response(res, 200, "Category deleted successfully");
    } catch (error) {
        return response(res, 500, { "message": "Error deleting category", "error": error });
    }
}

