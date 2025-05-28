import { Request, Response } from "express"
import { deleteImageFromCloudinary } from "../helpers/deleteImageFromCloudinary"

/**
 * Deletes an image from Cloudinary using the provided URL in body.public_id
 */
export const deleteImageHandler = async (req: Request, res: Response): Promise<void> => {
  const { public_id } = req.body

  if (!public_id) {
    res.status(400).json({ message: "❗ public_id is required" })
    return
  }

  try {
    await deleteImageFromCloudinary(public_id)
    res.status(200).json({ message: "✅ Image deleted successfully" })
  } catch (error) {
    console.error("❌ Error deleting image:", error)
    res.status(500).json({ message: "❌ Failed to delete image" })
  }
}
