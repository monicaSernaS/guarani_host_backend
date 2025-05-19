"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserProfile = void 0;
const User_1 = require("../models/User");
/**
 * @description Update logged-in user's profile
 * @route PATCH/api/users/profile
 * @access Private (authenticated user)
 */
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            res.status(401).json({ message: "❌ Unauthorized" });
            return;
        }
        const user = await User_1.User.findById(userId);
        if (!user) {
            res.status(404).json({ message: "❌ User not found" });
            return;
        }
        const allowedFields = ["firstName", "lastName", "email", "phone", "address"];
        const updates = {};
        //Only assign values that are provided and are allowed
        allowedFields.forEach((field) => {
            const key = field;
            if (req.body[field] !== undefined) {
                updates[key] = req.body[key];
            }
        });
        // Only updates
        Object.assign(user, updates);
        await user.save();
        res.status(200).json({
            message: "✅ Profile updated successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                AccountStatus: user.accountStatus,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error("❌Error updating user profile:", error);
        res.status(500).json({ message: "❌ Internal server error" });
    }
};
exports.updateUserProfile = updateUserProfile;
