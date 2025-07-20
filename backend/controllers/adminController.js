const Users = require("../models/Users");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Traveler = require("../models/Traveler");
const PaymentLog = require("../models/PaymentLog");
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Dispute = require('../models/Dispute');
const Admin = require('../models/Admin'); // New Admin model
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { response } = require("../utils/responses");

// Admin Authentication
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        //console.log(email, password);

        if (!email || !password) {
            return response(res, 400, { message: "Email and password are required" });
        }

        // Find admin by email
        const admin = await Admin.findOne({ email }).select('+password');
        if (!admin) {
            return response(res, 401, { message: "Invalid credentials" });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return response(res, 401, { message: "Admin account is deactivated" });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return response(res, 401, { message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                adminId: admin._id, 
                email: admin.email,
                role: admin.role,
                permissions: admin.permissions
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );


        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        const adminData = {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            permissions: admin.permissions,
            lastLogin: admin.lastLogin
        };
     
        return response(res, 200, { 
            message: "Login successful", 
            token,
            admin: adminData
        });
        

    } catch (error) {
        console.error('Admin login error:', error);
        return response(res, 500, { message: "Error during login", error: error.message });
    }
};

// Create new admin (only superadmin can do this)
exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, role = 'admin', permissions = [] } = req.body;

        if (!name || !email || !password) {
            return response(res, 400, { message: "Name, email, and password are required" });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return response(res, 409, { message: "Admin with this email already exists" });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new admin
        const newAdmin = new Admin({
            name,
            email,
            password: hashedPassword,
            role,
            permissions: role === 'superadmin' ? ['all'] : permissions,
            createdBy: req.admin.adminId,
            isActive: true
        });

        await newAdmin.save();

        const adminData = {
            id: newAdmin._id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role,
            permissions: newAdmin.permissions,
            isActive: newAdmin.isActive,
            createdAt: newAdmin.createdAt
        };

        return response(res, 201, { 
            message: "Admin created successfully", 
            admin: adminData 
        });

    } catch (error) {
        console.error('Create admin error:', error);
        return response(res, 500, { message: "Error creating admin", error: error.message });
    }
};

// Get all admins (only superadmin)
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find()
            .select('-password')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        return response(res, 200, { 
            message: "Admins fetched successfully", 
            admins 
        });
    } catch (error) {
        console.error('Get admins error:', error);
        return response(res, 500, { message: "Error fetching admins", error: error.message });
    }
};

// Update admin permissions (only superadmin)
exports.updateAdminPermissions = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { permissions, role, isActive } = req.body;

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return response(res, 404, { message: "Admin not found" });
        }

        // Prevent superadmin from modifying themselves
        if (admin._id.toString() === req.admin.adminId && !isActive) {
            return response(res, 400, { message: "Cannot deactivate your own account" });
        }

        // Update fields
        if (permissions !== undefined) admin.permissions = permissions;
        if (role !== undefined) admin.role = role;
        if (isActive !== undefined) admin.isActive = isActive;

        await admin.save();

        const updatedAdmin = await Admin.findById(adminId).select('-password');
        return response(res, 200, { 
            message: "Admin updated successfully", 
            admin: updatedAdmin 
        });

    } catch (error) {
        console.error('Update admin error:', error);
        return response(res, 500, { message: "Error updating admin", error: error.message });
    }
};

// Delete admin (only superadmin)
exports.deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Prevent superadmin from deleting themselves
        if (adminId === req.admin.adminId) {
            return response(res, 400, { message: "Cannot delete your own account" });
        }

        const admin = await Admin.findById(adminId);
        if (!admin) {
            return response(res, 404, { message: "Admin not found" });
        }

        await Admin.findByIdAndDelete(adminId);

        return response(res, 200, { message: "Admin deleted successfully" });

    } catch (error) {
        console.error('Delete admin error:', error);
        return response(res, 500, { message: "Error deleting admin", error: error.message });
    }
};

// Get current admin profile
exports.getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.adminId).select('-password');
        
        if (!admin) {
            return response(res, 404, { message: "Admin not found" });
        }

        return response(res, 200, { 
            message: "Admin profile fetched successfully", 
            admin 
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        return response(res, 500, { message: "Error fetching admin profile", error: error.message });
    }
};

// Update admin profile
exports.updateAdminProfile = async (req, res) => {
    try {
        const { name, currentPassword, newPassword } = req.body;
        const admin = await Admin.findById(req.admin.adminId).select('+password');

        if (!admin) {
            return response(res, 404, { message: "Admin not found" });
        }

        // Update name if provided
        if (name) {
            admin.name = name;
        }

        // Update password if provided
        if (newPassword) {
            if (!currentPassword) {
                return response(res, 400, { message: "Current password is required to change password" });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
            if (!isCurrentPasswordValid) {
                return response(res, 400, { message: "Current password is incorrect" });
            }

            const saltRounds = 12;
            admin.password = await bcrypt.hash(newPassword, saltRounds);
        }

        await admin.save();

        const updatedAdmin = await Admin.findById(req.admin.adminId).select('-password');
        return response(res, 200, { 
            message: "Profile updated successfully", 
            admin: updatedAdmin 
        });

    } catch (error) {
        console.error('Update admin profile error:', error);
        return response(res, 500, { message: "Error updating profile", error: error.message });
    }
};

// Admin logout (optional - mainly for logging purposes)
exports.adminLogout = async (req, res) => {
    try {
        // You can add logout logging here if needed
        return response(res, 200, { message: "Logout successful" });
    } catch (error) {
        console.error('Admin logout error:', error);
        return response(res, 500, { message: "Error during logout", error: error.message });
    }
};


exports.getAllUsers = async (req, res) => {
    try {
        const users = await Users.find();
        return response(res, 200, { message: "Users fetched successfully", users });
    } catch (error) {
        return response(res, 500, { message: "Error fetching users", error });
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        return response(res, 200, { message: "Products fetched successfully", products });
    } catch (error) {
        return response(res, 500, { message: "Error fetching products", error });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        if (!user) {
            return response(res, 404, { message: "User not found" });
        }
        return response(res, 200, { message: "User fetched successfully", user });
    } catch (error) {
        return response(res, 500, { message: "Error fetching user", error });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).select("-password");
        if (!product) {
            return response(res, 404, { message: "Product not found" });
        }
        return response(res, 200, { message: "Product fetched successfully", product });
    } catch (error) {
        return response(res, 500, { message: "Error fetching product", error });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        //console.log(orders);
        return response(res, 200, { message: "Orders fetched successfully", orders });
    } catch (error) {
        return response(res, 500, { message: "Error fetching orders", error });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return response(res, 404, { message: "Order not found" });
        }
        return response(res, 200, { message: "Order fetched successfully", order });
    } catch (error) {
        return response(res, 500, { message: "Error fetching order", error });
    }
};

exports.getAllTravelers = async (req, res) => {
    try {
        const travelers = await Traveler.find();
        const travelerDetails = await Users.findById(travelers.userId);
        
        return response(res, 200, { message: "Travelers fetched successfully", travelers });
    } catch (error) {
        return response(res, 500, { message: "Error fetching travelers", error });
    }
};

exports.getTravelerById = async (req, res) => {
    try {
        const traveler = await Traveler.findById(req.params.id);
        if (!traveler) {
            return response(res, 404, { message: "Traveler not found" });
        }
        //console.log(traveler);
        const user = await Users.findById(traveler.userId).select('-password');
        
        const products = await Product.find({ claimedBy: traveler._id });
        //console.log(products);
        const payments = await Payment.find({ traveler: traveler._id });
        console.log(payments);

        return response(res, 200, { message: "Traveler fetched successfully", traveler, user, products, payments });
    } catch (error) {
        return response(res, 500, { message: "Error fetching traveler", error });
    }
};

exports.getTransactionHistory = async (req, res) => {
    try {
        const transactions = await PaymentLog.find()
            .populate('orderNumber', 'userId totalAmount')
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        console.log(transactions)
        return response(res, 200, { success: true, transactions });
    } catch (err) {
        console.error('Error fetching transactions:', err);
        return response(res, 500, { success: false, message: 'Server error', error: err.message });
    }
};

exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
        .populate('client', 'name')
        .populate('order', 'orderNumber')
        .populate('product', 'productName claimedBy productFee productMarkup rewardAmount')
        .sort({ createdAt: -1 });
        return response(res, 200, { success: true, payments });
    } catch (err) {
        console.error('Error fetching payments:', err);
        return response(res, 500, { success: false, message: 'Server error', error: err.message });
    }
};

exports.getDisputes = async (req, res) => {
    try {
        const disputedOrders = await Order.find({
            'items.deliveryStatus': 'disputed'
        }).populate('userId', 'name')
          .populate('items.claimedBy', 'name');

        if (!disputedOrders.length) {
            return response(res, 200, { success: true, disputes: [], message: 'No disputed orders found' });
        }

        const disputes = disputedOrders.map(order => ({
            orderId: order._id,
            client: order.userId.name,
            traveler: order.items.find(i => i.deliveryStatus === 'disputed')?.claimedBy?.name || 'Unassigned',
            items: order.items.filter(i => i.deliveryStatus === 'disputed'),
            totalAmount: order.totalAmount,
            createdAt: order.updatedAt || order.createdAt,
        }));

        return response(res, 200, { success: true, disputes });
    } catch (err) {
        console.error('Error fetching disputes:', err);
        return response(res, 500, { success: false, message: 'Server error', error: err.message });
    }
};

const json2csv = require('json2csv').parse;
const fs = require('fs').promises;
const path = require('path');

exports.exportTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('orderId', 'userId totalAmount')
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        const csvFields = ['type', 'orderId', 'userId.name', 'amount', 'status', 'createdAt', 'details'];
        const csvData = transactions.map(t => ({
            type: t.type,
            orderId: t.orderId._id,
            'userId.name': t.userId.name,
            amount: t.amount,
            status: t.status,
            createdAt: t.createdAt.toISOString(),
            details: t.details,
        }));

        const csv = json2csv(csvData, { fields: csvFields });
        const filePath = path.join(__dirname, '..', 'exports', `transactions_${Date.now()}.csv`);

        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, csv);

        res.download(filePath, `transactions_${Date.now()}.csv`, (err) => {
            if (err) {
                console.error('Error sending file:', err);
                return response(res, 500, { success: false, message: 'Error exporting file' });
            }
            fs.unlink(filePath).catch(err => console.error('Error cleaning up file:', err));
        });
    } catch (err) {
        console.error('Error exporting transactions:', err);
        return response(res, 500, { success: false, message: 'Server error', error: err.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        // Fetch user and exclude password
        const user = await Users.findById(req.params.id).select('-password');
        if (!user) {
            return response(res, 404, { success: false, message: 'User not found' });
        }

        //console.log("userId:", user._id);
        //console.log("req.params.id:", req.params.id);

        // Fetch orders and payments using correct field name: userId
        const orders = await Order.find({ userId: user._id });
        
        const payments = await PaymentLog.find({ userId: user._id });

        return response(res, 200, {
            success: true,
            user,
            orders,
            payments,
            message: 'User details fetched successfully'
        });
    } catch (err) {
        console.error('Error fetching user details:', err);
        return response(res, 500, {
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
};
