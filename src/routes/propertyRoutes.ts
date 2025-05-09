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

/* ========================= PROPERTY ROUTES ========================= */

/**
 * @route   POST /api/admin/properties
 * @desc    Create a new property
 * @access  Private (admin and host)
 */
router.post(
  "/properties",
  protect,
  checkRole("admin", "host"),
  upload.fields([{ name: "images", maxCount: 10 }]), // Accept multiple images
  createProperty
);

/**
 * @route   GET /api/admin/properties
 * @desc    Get all properties (admin) or host's own properties
 * @access  Private (admin and host)
 */
router.get("/properties", protect, checkRole("admin", "host"), getProperties);

/**
 * @route   PATCH /api/admin/properties/:id
 * @desc    Update a property
 * @access  Private (admin only)
 */
router.patch("/properties/:id", protect, checkRole("admin"), updateProperty);

/**
 * @route   DELETE /api/admin/properties/:id
 * @desc    Delete a property and its images
 * @access  Private (admin only)
 */
router.delete("/properties/:id", protect, checkRole("admin"), deleteProperty);

export default router;
