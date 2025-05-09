import fs from "fs";
import cloudinary from "../config/cloudinaryConfig";

/**
 * Uploads multiple image files to Cloudinary and returns their secure URLs.
 * Cleans up local files after successful upload.
 *
 * @param files - Array of multer files
 * @returns Array of secure Cloudinary URLs
 */
export const uploadImagesToCloudinary = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  const imageUrls: string[] = [];

  for (const file of files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "guaranihost/payments", // Optional: organize uploads in folders
      });

      imageUrls.push(result.secure_url);

      // Delete the local file after upload
      fs.unlink(file.path, (err) => {
        if (err) {
          console.warn(`⚠️ Could not delete local file ${file.path}:`, err);
        }
      });
    } catch (error) {
      console.error(`❌ Error uploading image ${file.originalname}:`, error);
    }
  }

  return imageUrls;
};
