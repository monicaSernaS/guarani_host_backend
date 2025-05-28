import fs from "fs"
import cloudinary from "../config/cloudinaryConfig"
import { Express } from "express"

/**
 * Uploads multiple image files to Cloudinary and returns their secure URLs.
 * Automatically deletes local files after successful upload.
 *
 * @param files - Array of multer files
 * @returns Array of secure Cloudinary URLs
 */
export const uploadImagesToCloudinary = async (
  files: Express.Multer.File[]
): Promise<string[]> => {
  const imageUrls: string[] = []

  for (const file of files) {
    try {
      // Upload to Cloudinary (e.g., folder: 'guaranihost/properties')
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "guaranihost", // Optional: organize uploads
      })

      imageUrls.push(result.secure_url)

      // Delete the local file after successful upload
      fs.unlink(file.path, (err) => {
        if (err) {
          console.warn(`⚠️ Could not delete local file ${file.path}:`, err)
        } else {
          console.log(`🧹 Temp file deleted: ${file.path}`)
        }
      })
    } catch (error) {
      console.error(`❌ Failed to upload image ${file.originalname}:`, error)
    }
  }

  return imageUrls
}
