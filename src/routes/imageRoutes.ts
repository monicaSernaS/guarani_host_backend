import express from "express"
import { protect } from "../middlewares/protect"
import { deleteImageHandler } from "../controllers/imageController"

const router = express.Router()

/**
 * @route   DELETE /api/uploads
 * @desc    Deletes a Cloudinary image given its public secure URL
 * @access  Private (must be authenticated)
 */
router.delete("/", protect, deleteImageHandler)

export default router
