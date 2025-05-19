import express from "express";
import {
  createProperty,
  getProperties,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController";
import { protect } from "../middlewares/protect";
import { checkRole } from "../middlewares/checkRole";
import { upload } from "../config/multerConfig";

const router = express.Router();

/* ==================== ADMIN PROPERTY ROUTES ==================== */

/**
 * @route   POST /api/admin/properties
 * @desc    Create a new property (admin only)
 * @access  Private (admin only)
 */
router.post(
  "/properties",
  protect,
  checkRole("admin"),
  upload.fields([{ name: "images", maxCount: 10 }]),
  createProperty
);

/**
 * @route   GET /api/admin/properties
 * @desc    Get all properties (admin only)
 * @access  Private (admin only)
 */
router.get("/properties", protect, checkRole("admin"), getProperties);

/**
 * @route   PATCH /api/admin/properties/:id
 * @desc    Update a property (admin only)
 * @access  Private (admin only)
 */
router.patch(
  "/properties/:id",
  protect,
  checkRole("admin"),
  upload.fields([{ name: "images", maxCount: 10 }]),
  updateProperty
);

/**
 * @route   DELETE /api/admin/properties/:id
 * @desc    Delete a property and its images (admin only)
 * @access  Private (admin only)
 */
router.delete("/properties/:id", protect, checkRole("admin"), deleteProperty);

export default router;