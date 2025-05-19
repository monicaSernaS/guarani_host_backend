"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImageFromCloudinary = void 0;
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
/**
 * Deletes a single image from Cloudinary using its public ID.
 * @param imageUrl The secure URL of the image from Cloudinary.
 */
const deleteImageFromCloudinary = async (imageUrl) => {
    try {
        // Extract the public ID from the Cloudinary URL.
        const publicId = imageUrl.split('/').pop()?.split('.')[0];
        if (publicId) {
            const result = await cloudinaryConfig_1.default.uploader.destroy(publicId);
            if (result.result === 'ok') {
                console.log(`✅ Image deleted from Cloudinary: ${publicId}`);
            }
            else if (result.result === 'not found') {
                console.log(`⚠️ Image not found on Cloudinary: ${publicId}`);
            }
            else {
                console.error(`❌ Error deleting image ${publicId} from Cloudinary:`, result);
            }
        }
        else {
            console.warn(`⚠️ Could not extract public ID from URL: ${imageUrl}`);
        }
    }
    catch (error) {
        console.error("❌ Error deleting image from Cloudinary:", error);
        throw error; // Re-throw the error to be handled by the caller.
    }
};
exports.deleteImageFromCloudinary = deleteImageFromCloudinary;
