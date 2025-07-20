const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { response } = require('../utils/responses');

// Authenticate admin middleware
exports.authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return response(res, 401, { message: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verify admin still exists and is active
        const admin = await Admin.findById(decoded.adminId);
        if (!admin || !admin.isActive) {
            return response(res, 401, { message: 'Access denied. Admin not found or inactive.' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return response(res, 401, { message: 'Invalid token.' });
        } else if (error.name === 'TokenExpiredError') {
            return response(res, 401, { message: 'Token expired.' });
        }
        return response(res, 500, { message: 'Server error during authentication.' });
    }
};

// Check if admin is superadmin
exports.requireSuperAdmin = async (req, res, next) => {
    try {
        if (req.admin.role !== 'superadmin') {
            return response(res, 403, { message: 'Access denied. Superadmin role required.' });
        }
        next();
    } catch (error) {
        return response(res, 500, { message: 'Server error during authorization.' });
    }
};

// Check specific permission middleware
exports.requirePermission = (permission) => {
    return async (req, res, next) => {
        try {
            const admin = await Admin.findById(req.admin.adminId);
            
            if (!admin || !admin.hasPermission(permission)) {
                return response(res, 403, { 
                    message: `Access denied. Required permission: ${permission}` 
                });
            }
            
            next();
        } catch (error) {
            return response(res, 500, { message: 'Server error during authorization.' });
        }
    };
};

// Check resource access middleware
exports.requireResourceAccess = (resource, action = 'read') => {
    return async (req, res, next) => {
        try {
            const admin = await Admin.findById(req.admin.adminId);
            
            if (!admin || !admin.canAccess(resource, action)) {
                return response(res, 403, { 
                    message: `Access denied. Required permission: ${resource}.${action}` 
                });
            }
            
            next();
        } catch (error) {
            return response(res, 500, { message: 'Server error during authorization.' });
        }
    };
};

// Optional: Rate limiting for admin login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 1 * 60 * 1000; // 15 minutes

exports.rateLimitLogin = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (loginAttempts.has(ip)) {
        const attempts = loginAttempts.get(ip);
        
        // Clean up old attempts
        const validAttempts = attempts.filter(timestamp => now - timestamp < LOCKOUT_TIME);
        
        if (validAttempts.length >= MAX_LOGIN_ATTEMPTS) {
            return response(res, 429, { 
                message: 'Too many login attempts. Please try again later.' 
            });
        }
        
        loginAttempts.set(ip, validAttempts);
    }
    
    next();
};

// Add login attempt
exports.recordLoginAttempt = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!loginAttempts.has(ip)) {
        loginAttempts.set(ip, []);
    }
    
    loginAttempts.get(ip).push(now);
    next();
};