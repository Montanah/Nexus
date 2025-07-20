const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['admin', 'superadmin'],
        default: 'admin'
    },
    permissions: [{
        type: String,
        enum: [
            'users.read',
            'users.write',
            'products.read',
            'products.write',
            'orders.read',
            'orders.write',
            'travelers.read',
            'travelers.write',
            'transactions.read',
            'disputes.read',
            'disputes.write',
            'exports.read',
            'admins.read',
            'admins.write',
            'all' // Superadmin permission
        ]
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Index for email lookup
adminSchema.index({ email: 1 });

// Pre-save hook to set default permissions based on role
adminSchema.pre('save', function(next) {
    if (this.isModified('role') && this.role === 'superadmin') {
        this.permissions = ['all'];
    } else if (this.isModified('role') && this.role === 'admin' && this.permissions.includes('all')) {
        // Remove 'all' permission if role is changed from superadmin to admin
        this.permissions = this.permissions.filter(p => p !== 'all');
    }
    next();
});

// Method to check if admin has a specific permission
adminSchema.methods.hasPermission = function(permission) {
    return this.permissions.includes('all') || this.permissions.some(p => p === permission);
};

// Method to check if admin can perform action on resource
adminSchema.methods.canAccess = function(resource, action = 'read') {
    const permission = `${resource}.${action}`;
    return this.hasPermission(permission);
};

module.exports = mongoose.model('Admin', adminSchema);