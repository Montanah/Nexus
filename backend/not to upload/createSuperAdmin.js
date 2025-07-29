// scripts/createSuperAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
require('dotenv').config();

async function createSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus');
        console.log('Connected to MongoDB');

        // Check if superadmin already exists
        const existingSuperAdmin = await Admin.findOne({ role: 'superadmin' });
        if (existingSuperAdmin) {
            console.log('Superadmin already exists:', existingSuperAdmin.email);
            process.exit(0);
        }

        // Create superadmin
        const superAdminData = {
            name: 'Super Admin',
            email: 'superadmin@nexus.com', // Change this
            password: 'SuperAdmin123!', // Change this to a secure password
            role: 'superadmin',
            permissions: ['all'],
            isActive: true
        };

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(superAdminData.password, saltRounds);

        const superAdmin = new Admin({
            ...superAdminData,
            password: hashedPassword
        });

        await superAdmin.save();

        console.log('Superadmin created successfully!');
        console.log('Email:', superAdminData.email);
        console.log('Password:', superAdminData.password);
        console.log('⚠️  Please change the default password after first login!');

    } catch (error) {
        console.error('Error creating superadmin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Run the script
createSuperAdmin();