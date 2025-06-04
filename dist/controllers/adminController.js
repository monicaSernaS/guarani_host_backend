"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getAllUsers = exports.createUser = exports.deleteHost = exports.updateHost = exports.getAllHosts = exports.createHost = exports.deleteAdmin = exports.updateAdmin = exports.getAllAdmins = exports.createAdmin = void 0;
const User_1 = require("../models/User");
const generateToken_1 = require("../utils/generateToken");
/* ========================= ADMIN ========================= */
/**
 * @desc    Create a new admin (user with role "admin")
 * @route   POST /api/admin/create-admin
 * @access  Private (admin only)
 */
const createAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, address } = req.body;
        // Admin validation: Only allow creation of admin by an existing admin
        if (req.user?.role !== "admin") {
            res.status(403).json({ message: "🚫 Unauthorized: Only admins can create other admins" });
            return;
        }
        // Validating required fields
        if (!firstName || !lastName || !email || !password || !phone) {
            res.status(400).json({ message: "❗ All fields are required" });
            return;
        }
        // Check if the admin already exists
        const existingAdmin = await User_1.User.findOne({ email });
        if (existingAdmin) {
            res.status(400).json({ message: "❗ Admin with this email already exists" });
            return;
        }
        // Create new admin (user with 'admin' role)
        const newAdmin = new User_1.User({
            firstName,
            lastName,
            email,
            password,
            phone,
            address: address || "No address provided",
            role: "admin",
            accountStatus: "active"
        });
        await newAdmin.save();
        // Generate JWT token (optional for admin creation)
        const token = (0, generateToken_1.generateToken)(newAdmin._id.toString());
        res.status(201).json({
            message: "✅ Admin created successfully",
            user: newAdmin,
        });
    }
    catch (error) {
        console.error("❌ Error creating admin:", error);
        res.status(500).json({ message: "❌ Server error while creating admin" });
    }
};
exports.createAdmin = createAdmin;
/**
 * @desc    Get all admins (users with role 'admin')
 * @route   GET /api/admin/admins
 * @access  Private (admin only)
 */
const getAllAdmins = async (req, res) => {
    try {
        const admins = await User_1.User.find({ role: "admin" }).select("-password");
        res.status(200).json({
            message: "✅ Admins retrieved successfully",
            admins,
        });
    }
    catch (error) {
        console.error("❌ Error fetching admins:", error);
        res.status(500).json({ message: "❌ Server error while fetching admins" });
    }
};
exports.getAllAdmins = getAllAdmins;
/**
 * @desc    Update admin by ID
 * @route   PATCH /api/admin/admins/:id
 * @access  Private (admin only)
 */
const updateAdmin = async (req, res) => {
    try {
        const { firstName, lastName, phone, address, accountStatus } = req.body;
        // Validate the existence of at least one field
        if (!firstName && !lastName && !phone && !address && !accountStatus) {
            res.status(400).json({ message: "❗ No fields provided for update" });
            return;
        }
        // Validate accountStatus if provided
        if (accountStatus && !['active', 'suspended', 'deleted', 'pending_verification'].includes(accountStatus)) {
            res.status(400).json({ message: "❗ Invalid account status provided" });
            return;
        }
        const admin = await User_1.User.findById(req.params.id);
        if (!admin || admin.role !== "admin") {
            res.status(404).json({ message: "🚫 Admin not found" });
            return;
        }
        // Update fields
        admin.firstName = firstName || admin.firstName;
        admin.lastName = lastName || admin.lastName;
        admin.phone = phone || admin.phone;
        admin.address = address || admin.address;
        admin.accountStatus = accountStatus || admin.accountStatus;
        // Note: email and password are not updated for security
        await admin.save();
        res.status(200).json({
            message: "✅ Admin updated successfully",
            user: admin,
        });
    }
    catch (error) {
        console.error("❌ Error updating admin:", error);
        res.status(500).json({ message: "❌ Server error while updating admin" });
    }
};
exports.updateAdmin = updateAdmin;
/**
 * @desc    Delete an admin by ID
 * @route   DELETE /api/admin/admins/:id
 * @access  Private (admin only)
 */
const deleteAdmin = async (req, res) => {
    try {
        const admin = await User_1.User.findByIdAndDelete(req.params.id);
        if (!admin || admin.role !== "admin") {
            res.status(404).json({ message: "🚫 Admin not found" });
            return;
        }
        res.status(200).json({
            message: "✅ Admin deleted successfully",
            adminId: admin._id,
        });
    }
    catch (error) {
        console.error("❌ Error deleting admin:", error);
        res.status(500).json({ message: "❌ Server error while deleting admin" });
    }
};
exports.deleteAdmin = deleteAdmin;
/* ========================= HOSTS ========================= */
/**
 * @desc    Create a new host (user with role "host")
 * @route   POST /api/admin/create-host
 * @access  Private (admin only)
 */
const createHost = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, address, accountStatus } = req.body;
        // Validating required fields
        if (!firstName || !lastName || !email || !password || !phone || !address) {
            res.status(400).json({ message: "❗ All fields are required" });
            return;
        }
        // Validate accountStatus if provided
        if (accountStatus && !['active', 'suspended', 'deleted', 'pending_verification'].includes(accountStatus)) {
            res.status(400).json({ message: "❗ Invalid account status provided" });
            return;
        }
        // Check if the host already exists
        const existingHost = await User_1.User.findOne({ email });
        if (existingHost) {
            res.status(400).json({ message: "❗ Host with this email already exists" });
            return;
        }
        // Create new host (user with 'host' role)
        const newHost = new User_1.User({
            firstName,
            lastName,
            email,
            password,
            phone,
            address,
            role: "host",
            accountStatus: accountStatus || "active", // Default to active if not provided
        });
        await newHost.save();
        // Generate JWT token (optional for host creation)
        const token = (0, generateToken_1.generateToken)(newHost._id.toString());
        res.status(201).json({
            message: "✅ Host created successfully",
            user: newHost,
        });
    }
    catch (error) {
        console.error("❌ Error creating host:", error);
        res.status(500).json({ message: "❌ Server error while creating host" });
    }
};
exports.createHost = createHost;
/**
 * @desc    Get all hosts (users with role 'host')
 * @route   GET /api/admin/hosts
 * @access  Private (admin only)
 */
const getAllHosts = async (req, res) => {
    try {
        const hosts = await User_1.User.find({ role: "host" }).select("-password");
        res.status(200).json({
            message: "✅ Hosts retrieved successfully",
            hosts,
        });
    }
    catch (error) {
        console.error("❌ Error fetching hosts:", error);
        res.status(500).json({ message: "❌ Server error while fetching hosts" });
    }
};
exports.getAllHosts = getAllHosts;
/**
 * @desc    Update host by ID
 * @route   PATCH /api/admin/hosts/:id
 * @access  Private (admin only)
 */
const updateHost = async (req, res) => {
    try {
        const { firstName, lastName, phone, address, accountStatus } = req.body;
        // Validate the existence of at least one field
        if (!firstName && !lastName && !phone && !address && !accountStatus) {
            res.status(400).json({ message: "❗ No fields provided for update" });
            return;
        }
        // Validate accountStatus if provided
        if (accountStatus && !['active', 'suspended', 'deleted', 'pending_verification'].includes(accountStatus)) {
            res.status(400).json({ message: "❗ Invalid account status provided" });
            return;
        }
        const host = await User_1.User.findById(req.params.id);
        if (!host || host.role !== "host") {
            res.status(404).json({ message: "🚫 Host not found" });
            return;
        }
        // Update fields
        host.firstName = firstName || host.firstName;
        host.lastName = lastName || host.lastName;
        host.phone = phone || host.phone;
        host.address = address || host.address;
        host.accountStatus = accountStatus || host.accountStatus;
        // Note: email and password are not updated for security
        await host.save();
        res.status(200).json({
            message: "✅ Host updated successfully",
            user: host,
        });
    }
    catch (error) {
        console.error("❌ Error updating host:", error);
        res.status(500).json({ message: "❌ Server error while updating host" });
    }
};
exports.updateHost = updateHost;
/**
 * @desc    Delete a host by ID
 * @route   DELETE /api/admin/hosts/:id
 * @access  Private (admin only)
 */
const deleteHost = async (req, res) => {
    try {
        const host = await User_1.User.findByIdAndDelete(req.params.id);
        if (!host || host.role !== "host") {
            res.status(404).json({ message: "🚫 Host not found" });
            return;
        }
        res.status(200).json({
            message: "✅ Host deleted successfully",
            hostId: host._id,
        });
    }
    catch (error) {
        console.error("❌ Error deleting host:", error);
        res.status(500).json({ message: "❌ Server error while deleting host" });
    }
};
exports.deleteHost = deleteHost;
/* ========================= USERS ========================= */
/**
 * @desc    Create a new user (user with role "user")
 * @route   POST /api/admin/users
 * @access  Private (admin only)
 */
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, address, role, accountStatus } = req.body;
        // Validating required fields
        if (!firstName || !lastName || !email || !password || !phone || !address || !role) {
            res.status(400).json({ message: "❗ All fields are required" });
            return;
        }
        // Validate role
        if (!['admin', 'host', 'user'].includes(role)) {
            res.status(400).json({ message: "❗ Invalid role provided" });
            return;
        }
        // Validate accountStatus if provided
        if (accountStatus && !['active', 'suspended', 'deleted', 'pending_verification'].includes(accountStatus)) {
            res.status(400).json({ message: "❗ Invalid account status provided" });
            return;
        }
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "❗ User with this email already exists" });
            return;
        }
        // Create new user
        const newUser = new User_1.User({
            firstName,
            lastName,
            email,
            password,
            phone,
            address,
            role,
            accountStatus: accountStatus || "active", // Default to active if not provided
        });
        await newUser.save();
        res.status(201).json({
            message: "✅ User created successfully",
            user: newUser,
        });
    }
    catch (error) {
        console.error("❌ Error creating user:", error);
        res.status(500).json({ message: "❌ Server error while creating user" });
    }
};
exports.createUser = createUser;
/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private (admin only)
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User_1.User.find().select("-password");
        res.status(200).json({
            message: "✅ Users retrieved successfully",
            users,
        });
    }
    catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ message: "❌ Server error while fetching users" });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * @desc    Update user by ID
 * @route   PATCH /api/admin/users/:id
 * @access  Private (admin only)
 */
const updateUser = async (req, res) => {
    try {
        // Acceptable fields for update
        const { firstName, lastName, phone, address, role, accountStatus } = req.body;
        // At least a field must be provided
        if (!firstName && !lastName && !phone && !address && !role && !accountStatus) {
            res.status(400).json({ message: "❗ No fields provided for update" });
            return;
        }
        // Validate role if provided
        if (role && !['admin', 'host', 'user'].includes(role)) {
            res.status(400).json({ message: "❗ Invalid role provided" });
            return;
        }
        // Validate accountStatus if provided
        if (accountStatus && !['active', 'suspended', 'deleted', 'pending_verification'].includes(accountStatus)) {
            res.status(400).json({ message: "❗ Invalid account status provided" });
            return;
        }
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: "🚫 User not found" });
            return;
        }
        // Update all fields except email and password
        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.phone = phone || user.phone;
        user.address = address || user.address;
        user.role = role || user.role;
        user.accountStatus = accountStatus || user.accountStatus;
        // Email y password not update, security things
        await user.save();
        res.status(200).json({
            message: "✅ User updated successfully",
            user,
        });
    }
    catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).json({ message: "❌ Server error while updating user" });
    }
};
exports.updateUser = updateUser;
/**
 * @desc    Delete user by ID
 * @route   DELETE /api/admin/users/:id
 * @access  Private (admin only)
 */
const deleteUser = async (req, res) => {
    try {
        const user = await User_1.User.findByIdAndDelete(req.params.id);
        if (!user) {
            res.status(404).json({ message: "🚫 User not found" });
            return;
        }
        res.status(200).json({
            message: "✅ User deleted successfully",
            userId: user._id,
        });
    }
    catch (error) {
        console.error("❌ Error deleting user:", error);
        res.status(500).json({ message: "❌ Server error while deleting user" });
    }
};
exports.deleteUser = deleteUser;
