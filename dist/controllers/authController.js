"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const generateToken_1 = require("../utils/generateToken");
const enums_1 = require("../@types/express/enums");
/* ======================== AUTH CONTROLLERS ======================== */
/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, address, role } = req.body;
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !phone || !address) {
            res.status(400).json({ message: "❗ All fields are required" });
            return;
        }
        // Validate email format
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ message: "❗ Invalid email format" });
            return;
        }
        // Check if email already exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "❗ Email already in use" });
            return;
        }
        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            res.status(400).json({
                message: "❗ Password must contain at least 8 characters, one uppercase, one lowercase, and one number.",
            });
            return;
        }
        // Create new user (password will be hashed via pre-save hook)
        const newUser = new User_1.User({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password: password.trim(),
            phone: phone.trim(),
            address: address.trim(),
            role: role?.toLowerCase() || "user",
            accountStatus: enums_1.AccountStatus.ACTIVE,
        });
        await newUser.save();
        const token = (0, generateToken_1.generateToken)(newUser._id.toString());
        res.status(201).json({
            message: "✅ User registered successfully",
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                phone: newUser.phone,
                address: newUser.address,
                role: newUser.role,
                accountStatus: newUser.accountStatus,
            },
            token,
        });
    }
    catch (error) {
        console.error("❌ Error in register:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.register = register;
/**
 * @desc    Log in an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Validate input
        if (!email || !password) {
            res.status(400).json({ message: "❗ Email and password are required" });
            return;
        }
        // Find user by email
        const user = await User_1.User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: "❗ Invalid credentials" });
            return;
        }
        // Compare passwords using model method
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: "❗ Invalid credentials" });
            return;
        }
        // Check account status
        const status = user.accountStatus?.toLowerCase();
        if (status === enums_1.AccountStatus.SUSPENDED) {
            res.status(403).json({ message: "🚫 Account is suspended" });
            return;
        }
        if (status === enums_1.AccountStatus.DELETED) {
            res.status(403).json({ message: "🚫 Account has been deleted" });
            return;
        }
        if (status === enums_1.AccountStatus.PENDING_VERIFICATION) {
            res.status(403).json({ message: "⚠️ Account is pending verification" });
            return;
        }
        // Generate JWT token
        const token = (0, generateToken_1.generateToken)(user._id.toString());
        res.status(200).json({
            message: "✅ Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                accountStatus: user.accountStatus,
            },
            token,
        });
    }
    catch (error) {
        console.error("❌ Error in login:", error);
        res.status(500).json({ message: "❌ Server error" });
    }
};
exports.login = login;
