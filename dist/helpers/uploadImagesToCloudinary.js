"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImagesToCloudinary = void 0;
const fs_1 = __importDefault(require("fs"));
const cloudinaryConfig_1 = __importDefault(require("../config/cloudinaryConfig"));
/**
 * Uploads multiple image files to Cloudinary and returns their secure URLs.
 * Cleans up local files after successful upload.
 *
 * @param files - Array of multer files
 * @returns Array of secure Cloudinary URLs
 */
const uploadImagesToCloudinary = async (files) => {
    const imageUrls = [];
    for (const file of files) {
        try {
            const result = await cloudinaryConfig_1.default.uploader.upload(file.path, {
                folder: "guaranihost/payments", // Optional: organize uploads in folders
            });
            imageUrls.push(result.secure_url);
            // Delete the local file after upload
            fs_1.default.unlink(file.path, (err) => {
                if (err) {
                    console.warn(`⚠️ Could not delete local file ${file.path}:`, err);
                }
            });
        }
        catch (error) {
            console.error(`❌ Error uploading image ${file.originalname}:`, error);
        }
    }
    return imageUrls;
};
exports.uploadImagesToCloudinary = uploadImagesToCloudinary;
