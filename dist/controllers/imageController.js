"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageHandler = void 0;
const deleteImageFromCloudinary_1 = require("../helpers/deleteImageFromCloudinary");
/**
 * Deletes an image from Cloudinary using the provided URL in body.public_id
 */
const deleteImageHandler = async (req, res) => {
    const { public_id } = req.body;
    if (!public_id) {
        res.status(400).json({ message: "❗ public_id is required" });
        return;
    }
    try {
        await (0, deleteImageFromCloudinary_1.deleteImageFromCloudinary)(public_id);
        res.status(200).json({ message: "✅ Image deleted successfully" });
    }
    catch (error) {
        console.error("❌ Error deleting image:", error);
        res.status(500).json({ message: "❌ Failed to delete image" });
    }
};
exports.deleteImageHandler = deleteImageHandler;
