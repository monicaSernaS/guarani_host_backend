"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = void 0;
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
/**
 * Deletes a single image from Cloudinary using its secure URL.
 *
 * @param imageUrl - The full secure_url of the image uploaded to Cloudinary
 * @returns Promise<void>
 */
const deleteImageFromCloudinary = async (imageUrl) => {
    try {
        // Extract public ID from URL (e.g., guaranihost/myfolder/file)
        const parts = imageUrl.split('/');
        const fileWithExtension = parts[parts.length - 1];
        const [publicIdWithoutExtension] = fileWithExtension.split('.');
        // Extract folder path: starts at "guaranihost"
        const folder = parts.slice(parts.indexOf("guaranihost")).slice(0, -1).join('/');
        const publicId = `${folder}/${publicIdWithoutExtension}`;
        const result = await cloudinaryConfig_1.default.uploader.destroy(publicId);
        if (result.result === 'ok') {
            console.log(`✅ Image deleted from Cloudinary: ${publicId}`);
        }
        else if (result.result === 'not found') {
            console.warn(`⚠️ Image not found on Cloudinary: ${publicId}`);
        }
        else {
            console.error(`❌ Failed to delete image ${publicId}:`, result);
        }
    }
    catch (error) {
        console.error("❌ Error deleting image from Cloudinary:", error);
        throw error;
    }
};
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
