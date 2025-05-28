import cloudinary from "../config/cloudinaryConfig"

/**
 * Deletes a single image from Cloudinary using its secure URL.
 *
 * @param imageUrl - The full secure_url of the image uploaded to Cloudinary
 * @returns Promise<void>
 */
export const deleteImageFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the public ID from the Cloudinary URL
    const parts = imageUrl.split('/')
    const fileWithExtension = parts[parts.length - 1]
    const [publicIdWithoutExtension] = fileWithExtension.split('.')
    const folder = parts.slice(parts.indexOf("guaranihost")).slice(0, -1).join('/') // e.g., guaranihost/myfolder

    const publicId = `${folder}/${publicIdWithoutExtension}`

    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      console.log(`✅ Image deleted from Cloudinary: ${publicId}`)
    } else if (result.result === 'not found') {
      console.warn(`⚠️ Image not found on Cloudinary: ${publicId}`)
    } else {
      console.error(`❌ Failed to delete image ${publicId}:`, result)
    }
  } catch (error) {
    console.error("❌ Error deleting image from Cloudinary:", error)
    throw error
  }
}
